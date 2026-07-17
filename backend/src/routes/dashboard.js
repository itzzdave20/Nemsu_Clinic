import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const [[patients]] = await pool.query('SELECT COUNT(*) as count FROM patients');
    const [[appointments]] = await pool.query("SELECT COUNT(*) as count FROM appointments WHERE status IN ('pending','confirmed')");
    const [[todayAppts]] = await pool.query('SELECT COUNT(*) as count FROM appointments WHERE visit_date = CURDATE()');
    const [[consultations]] = await pool.query('SELECT COUNT(*) as count FROM consultations');
    const [[lowStock]] = await pool.query('SELECT COUNT(*) as count FROM inventory WHERE quantity <= reorder_level');
    const [[symptomChecks]] = await pool.query('SELECT COUNT(*) as count FROM symptom_checks');
    const [[prescriptions]] = await pool.query("SELECT COUNT(*) as count FROM prescriptions WHERE status = 'active'");
    const [[pendingLabs]] = await pool.query("SELECT COUNT(*) as count FROM lab_requests WHERE status IN ('pending','in_progress')");
    const [[pendingReferrals]] = await pool.query("SELECT COUNT(*) as count FROM referrals WHERE status IN ('pending','sent')");

    const [recentAppts] = await pool.query(`
      SELECT a.id, a.visit_date, a.visit_time, a.status, a.reason,
             p.school_id, u.full_name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      ORDER BY a.visit_date DESC, a.visit_time DESC LIMIT 5
    `);

    const [illnessTrends] = await pool.query(`
      SELECT diagnosis, COUNT(*) as count FROM consultations
      WHERE diagnosis IS NOT NULL AND diagnosis != ''
      GROUP BY diagnosis ORDER BY count DESC LIMIT 5
    `);

    res.json({
      stats: {
        patients: patients.count,
        pendingAppointments: appointments.count,
        todayAppointments: todayAppts.count,
        consultations: consultations.count,
        lowStock: lowStock.count,
        symptomChecks: symptomChecks.count,
        activePrescriptions: prescriptions.count,
        pendingLabs: pendingLabs.count,
        pendingReferrals: pendingReferrals.count,
      },
      recentAppointments: recentAppts,
      illnessTrends,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
