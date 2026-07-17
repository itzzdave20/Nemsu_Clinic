import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, p.school_id, u.full_name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      ORDER BY a.visit_date DESC, a.visit_time DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { patient_id, doctor_id, visit_date, visit_time, reason } = req.body;
    const [result] = await pool.query(
      'INSERT INTO appointments (patient_id, doctor_id, visit_date, visit_time, reason) VALUES (?, ?, ?, ?, ?)',
      [patient_id, doctor_id || null, visit_date, visit_time, reason || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Appointment booked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

router.patch('/:id/status', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

export default router;
