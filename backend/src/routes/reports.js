import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);

    const [[totals]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM patients) AS patients,
        (SELECT COUNT(*) FROM appointments) AS appointments,
        (SELECT COUNT(*) FROM consultations) AS consultations,
        (SELECT COUNT(*) FROM prescriptions WHERE status = 'active') AS activePrescriptions,
        (SELECT COUNT(*) FROM lab_requests WHERE status IN ('pending','in_progress')) AS pendingLabs,
        (SELECT COUNT(*) FROM inventory WHERE quantity <= reorder_level) AS lowStock
    `);

    const [appointmentsByStatus] = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM appointments
      GROUP BY status
      ORDER BY count DESC
    `);

    const [patientsByType] = await pool.query(`
      SELECT patient_type AS label, COUNT(*) AS count
      FROM patients
      GROUP BY patient_type
      ORDER BY count DESC
    `);

    const [visitsByDay] = await pool.query(`
      SELECT DATE_FORMAT(visit_date, '%Y-%m-%d') AS day, COUNT(*) AS count
      FROM appointments
      WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY visit_date
      ORDER BY visit_date ASC
    `, [days]);

    const [topDiagnoses] = await pool.query(`
      SELECT diagnosis AS label, COUNT(*) AS count
      FROM consultations
      WHERE diagnosis IS NOT NULL AND TRIM(diagnosis) != ''
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY diagnosis
      ORDER BY count DESC
      LIMIT 8
    `, [days]);

    const [commonComplaints] = await pool.query(`
      SELECT LEFT(chief_complaint, 80) AS label, COUNT(*) AS count
      FROM consultations
      WHERE chief_complaint IS NOT NULL AND TRIM(chief_complaint) != ''
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY LEFT(chief_complaint, 80)
      ORDER BY count DESC
      LIMIT 6
    `, [days]);

    const [medicationUsage] = await pool.query(`
      SELECT medication_name AS label, COUNT(*) AS count
      FROM prescriptions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY medication_name
      ORDER BY count DESC
      LIMIT 8
    `, [days]);

    const [inventoryAlert] = await pool.query(`
      SELECT item_name, item_type, quantity, unit, reorder_level, expiry_date
      FROM inventory
      WHERE quantity <= reorder_level
      ORDER BY quantity ASC
      LIMIT 10
    `);

    const [recentConsultations] = await pool.query(`
      SELECT c.id, c.diagnosis, c.chief_complaint, c.created_at,
             p.school_id, u.full_name AS doctor_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.doctor_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 8
    `);

    res.json({
      periodDays: days,
      totals,
      appointmentsByStatus,
      patientsByType,
      visitsByDay,
      topDiagnoses,
      commonComplaints,
      medicationUsage,
      inventoryAlert,
      recentConsultations,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

export default router;
