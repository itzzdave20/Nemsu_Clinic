import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, p.school_id, u.full_name as doctor_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.doctor_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

router.post('/', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { appointment_id, patient_id, chief_complaint, diagnosis, treatment_plan, vital_signs } = req.body;
    const [result] = await pool.query(
      `INSERT INTO consultations (appointment_id, patient_id, doctor_id, chief_complaint, diagnosis, treatment_plan, vital_signs)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [appointment_id || null, patient_id, req.user.id, chief_complaint, diagnosis, treatment_plan, JSON.stringify(vital_signs || {})]
    );
    if (appointment_id) {
      await pool.query("UPDATE appointments SET status = 'completed' WHERE id = ?", [appointment_id]);
    }
    res.status(201).json({ id: result.insertId, message: 'Consultation recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create consultation' });
  }
});

export default router;
