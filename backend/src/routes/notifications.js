import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  sendReminder, sendMultiChannelReminder, getUpcomingAppointments, buildReminderMessage, processScheduledReminders,
} from '../utils/reminders.js';
import { isEmailConfigured, getSmtpStatus, verifySmtp, sendTestEmail } from '../services/email.js';
import { isSmsConfigured } from '../services/sms.js';

const router = express.Router();

function resolveChannels(channel) {
  if (channel === 'all') return ['in_app', 'email', 'sms'];
  return [channel || 'in_app'];
}

router.get('/status', authenticate, authorize('admin'), (_req, res) => {
  const smtp = getSmtpStatus();
  res.json({
    email: smtp.configured,
    sms: isSmsConfigured(),
    cronEnabled: process.env.REMINDER_CRON_ENABLED === 'true',
    cronSchedule: process.env.REMINDER_CRON_SCHEDULE || '0 8 * * *',
    defaultChannel: process.env.REMINDER_DEFAULT_CHANNEL || 'in_app',
    smtp,
    smsProvider: isSmsConfigured() ? 'Semaphore' : null,
    setupHints: {
      email: smtp.configured
        ? null
        : 'Set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env then restart the API.',
      sms: isSmsConfigured()
        ? null
        : 'Set SEMAPHORE_API_KEY in backend/.env (https://semaphore.co/).',
      cron: process.env.REMINDER_CRON_ENABLED === 'true'
        ? null
        : 'Set REMINDER_CRON_ENABLED=true to auto-send daily reminders.',
    },
  });
});

/** Verify SMTP connection (admin) */
router.post('/smtp/verify', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const result = await verifySmtp();
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/** Send test email (admin) */
router.post('/smtp/test', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'SMTP is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to backend/.env',
      });
    }
    const to = (req.body.to || '').trim() || undefined;
    const result = await sendTestEmail(to);
    res.status(result.success ? 200 : 400).json({
      ...result,
      message: result.success
        ? `Test email sent to ${to || process.env.SMTP_USER}`
        : result.error,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT id, user_id, patient_id, appointment_id, channel, type, subject, message, status,
             DATE_FORMAT(sent_at, '%Y-%m-%d %H:%i') AS sent_at,
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
      FROM notifications
    `;
    const params = [];
    if (req.user.role === 'patient') {
      sql += ' WHERE patient_id IN (SELECT id FROM patients WHERE user_id = ?) OR user_id = ?';
      params.push(req.user.id, req.user.id);
    }
    sql += ' ORDER BY id DESC LIMIT 50';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/upcoming', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 2;
    res.json(await getUpcomingAppointments(days));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
});

router.post('/remind/:appointmentId', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.patient_id, a.doctor_id, a.reason, a.status,
             DATE_FORMAT(a.visit_date, '%Y-%m-%d') AS visit_date,
             TIME_FORMAT(a.visit_time, '%H:%i') AS visit_time,
             p.school_id, p.user_id as patient_user_id,
             u.email, u.phone, u.full_name as patient_name, d.full_name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN users d ON a.doctor_id = d.id
      WHERE a.id = ?
    `, [req.params.appointmentId]);

    const appt = rows[0];
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const channels = resolveChannels(req.body.channel);
    if (channels.includes('email') && !appt.email) {
      return res.status(400).json({ error: 'Patient has no email on file' });
    }
    if (channels.includes('sms') && !appt.phone) {
      return res.status(400).json({ error: 'Patient has no phone number on file' });
    }
    if (channels.includes('email') && !isEmailConfigured()) {
      return res.status(400).json({ error: 'SMTP is not configured. Update backend/.env then restart the API.' });
    }
    if (channels.includes('sms') && !isSmsConfigured()) {
      return res.status(400).json({ error: 'SMS is not configured. Set SEMAPHORE_API_KEY in backend/.env' });
    }

    const { subject, message, html } = buildReminderMessage(appt);
    const params = {
      userId: appt.patient_user_id,
      patientId: appt.patient_id,
      appointmentId: appt.id,
      subject,
      message,
      html,
      email: appt.email,
      phone: appt.phone,
    };

    const results = channels.length > 1
      ? await sendMultiChannelReminder(params, channels)
      : [await sendReminder({ ...params, channel: channels[0] })];

    const failed = results.filter(r => r.status === 'failed');
    res.json({
      message: failed.length
        ? `Completed with ${failed.length} failure(s): ${failed.map(f => f.error).filter(Boolean).join('; ')}`
        : `Reminder sent via ${channels.join(', ')}`,
      results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

router.post('/remind-all', authenticate, authorize('admin', 'nurse'), async (req, res) => {
  try {
    const appointments = await getUpcomingAppointments(2);
    const channels = resolveChannels(req.body.channel);

    if (channels.includes('email') && !isEmailConfigured()) {
      return res.status(400).json({ error: 'SMTP is not configured. Update backend/.env then restart the API.' });
    }
    if (channels.includes('sms') && !isSmsConfigured()) {
      return res.status(400).json({ error: 'SMS is not configured. Set SEMAPHORE_API_KEY in backend/.env' });
    }

    const allResults = [];
    for (const appt of appointments) {
      const { subject, message, html } = buildReminderMessage(appt);
      const results = await sendMultiChannelReminder({
        userId: appt.patient_user_id,
        patientId: appt.patient_id,
        appointmentId: appt.id,
        subject,
        message,
        html,
        email: appt.email,
        phone: appt.phone,
      }, channels);
      allResults.push(...results);
    }

    const sent = allResults.filter(r => r.status === 'sent').length;
    const failed = allResults.filter(r => r.status === 'failed').length;
    res.json({
      message: failed
        ? `${sent} sent, ${failed} failed`
        : `${sent} notification(s) sent successfully`,
      count: sent,
      failed,
      results: allResults,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

router.post('/cron/run', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const result = await processScheduledReminders();
    res.json({ message: 'Scheduled reminders processed', ...result });
  } catch (err) {
    res.status(500).json({ error: 'Cron execution failed' });
  }
});

export default router;
