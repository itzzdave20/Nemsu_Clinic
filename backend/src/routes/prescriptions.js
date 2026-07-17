import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT pr.*, p.school_id, u.full_name as doctor_name
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN users u ON pr.doctor_id = u.id
    `;
    const params = [];
    if (req.user.role === 'patient') {
      sql += ' WHERE pr.patient_id IN (SELECT id FROM patients WHERE user_id = ?)';
      params.push(req.user.id);
    }
    sql += ' ORDER BY pr.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

router.post('/', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { consultation_id, patient_id, medication_name, dosage, frequency, duration, instructions } = req.body;
    const [result] = await pool.query(
      `INSERT INTO prescriptions (consultation_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [consultation_id || null, patient_id, req.user.id, medication_name, dosage, frequency, duration, instructions]
    );
    res.status(201).json({ id: result.insertId, message: 'Prescription created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

router.patch('/:id/status', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const valid = ['active', 'completed', 'cancelled'];
    if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    await pool.query('UPDATE prescriptions SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

export default router;
