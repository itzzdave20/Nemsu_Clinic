import pool from '../config/database.js';
import { sendEmail, buildAppointmentEmailHtml } from '../services/email.js';
import { sendSms } from '../services/sms.js';

function formatVisitDate(value) {
  if (!value) return '—';
  // MySQL DATE may arrive as Date or 'YYYY-MM-DD'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      timeZone: 'Asia/Manila',
    });
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-PH', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    timeZone: 'Asia/Manila',
  });
}

function formatVisitTime(value) {
  const s = String(value || '').slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(s)) return s || '—';
  const [h, m] = s.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

async function deliver(channel, { email, phone, subject, message, html }) {
  if (channel === 'in_app') return { success: true };
  if (channel === 'email') return sendEmail({ to: email, subject, text: message, html });
  if (channel === 'sms') {
    const short = message.length > 300 ? `${message.slice(0, 297)}...` : message;
    return sendSms({ to: phone, message: short });
  }
  return { success: false, error: 'Unknown channel' };
}

export async function sendReminder({
  userId, patientId, appointmentId, channel, subject, message, email, phone, html,
}) {
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, patient_id, appointment_id, channel, type, subject, message, status)
     VALUES (?, ?, ?, ?, 'appointment_reminder', ?, ?, 'pending')`,
    [userId, patientId, appointmentId, channel, subject, message]
  );

  const notificationId = result.insertId;
  const delivery = await deliver(channel, { email, phone, subject, message, html });
  const status = delivery.success ? 'sent' : 'failed';

  await pool.query(
    'UPDATE notifications SET status = ?, sent_at = IF(? = "sent", NOW(), NULL) WHERE id = ?',
    [status, status, notificationId]
  );

  if (!delivery.success && channel !== 'in_app') {
    console.warn(`[REMINDER] ${channel} failed #${notificationId}:`, delivery.error);
  }

  return { id: notificationId, channel, status, error: delivery.error || null };
}

export async function sendMultiChannelReminder(params, channels = ['in_app']) {
  const results = [];
  for (const channel of channels) {
    results.push(await sendReminder({ ...params, channel }));
  }
  return results;
}

export async function getUpcomingAppointments(days = 1) {
  const [rows] = await pool.query(`
    SELECT a.id, a.patient_id, a.doctor_id, a.reason, a.status, a.notes, a.created_at,
           DATE_FORMAT(a.visit_date, '%Y-%m-%d') AS visit_date,
           TIME_FORMAT(a.visit_time, '%H:%i') AS visit_time,
           p.school_id, p.user_id as patient_user_id,
           u.full_name as patient_name, u.email, u.phone,
           d.full_name as doctor_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN users d ON a.doctor_id = d.id
    WHERE a.status IN ('pending','confirmed')
      AND a.visit_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    ORDER BY a.visit_date, a.visit_time
  `, [days]);
  return rows;
}

export function buildReminderMessage(appt) {
  const dateLabel = formatVisitDate(appt.visit_date);
  const timeLabel = formatVisitTime(appt.visit_time);
  const subject = 'Appointment Reminder — NEMSU HealthHub';
  const message = `Dear ${appt.patient_name || appt.school_id},

This is a reminder for your clinic appointment on ${dateLabel} at ${timeLabel}.
Reason: ${appt.reason || 'General consultation'}
Doctor: ${appt.doctor_name || 'Clinic staff'}

Please arrive 10 minutes early and bring your school ID.

— NEMSU Cantilan Campus Clinic`;

  const html = buildAppointmentEmailHtml(appt, dateLabel, timeLabel);
  return { subject, message, html };
}

export async function processScheduledReminders() {
  const channel = process.env.REMINDER_DEFAULT_CHANNEL || 'in_app';
  const channels = channel === 'all' ? ['in_app', 'email', 'sms'] : [channel];
  const appointments = await getUpcomingAppointments(1);
  const results = [];

  for (const appt of appointments) {
    const { subject, message, html } = buildReminderMessage(appt);
    const r = await sendMultiChannelReminder({
      userId: appt.patient_user_id,
      patientId: appt.patient_id,
      appointmentId: appt.id,
      subject,
      message,
      html,
      email: appt.email,
      phone: appt.phone,
    }, channels);
    results.push(...r);
  }

  console.log(`[CRON] Processed ${appointments.length} appointment reminders`);
  return { appointments: appointments.length, notifications: results.length, results };
}

export { formatVisitDate, formatVisitTime };
