import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT r.*, p.school_id, u.full_name as doctor_name
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON r.doctor_id = u.id
    `;
    const params = [];
    if (req.user.role === 'patient') {
      sql += ' WHERE r.patient_id IN (SELECT id FROM patients WHERE user_id = ?)';
      params.push(req.user.id);
    }
    sql += ' ORDER BY r.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

router.post('/', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { consultation_id, patient_id, facility_name, specialist, reason, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO referrals (consultation_id, patient_id, doctor_id, facility_name, specialist, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [consultation_id || null, patient_id, req.user.id, facility_name, specialist, reason, notes || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Referral created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

router.patch('/:id/status', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const valid = ['pending', 'sent', 'completed', 'cancelled'];
    if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    await pool.query('UPDATE referrals SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update referral' });
  }
});

export default router;
