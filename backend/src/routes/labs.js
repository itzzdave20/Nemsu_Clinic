import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT lr.*, p.school_id, u.full_name as doctor_name
      FROM lab_requests lr
      JOIN patients p ON lr.patient_id = p.id
      JOIN users u ON lr.doctor_id = u.id
    `;
    const params = [];
    if (req.user.role === 'patient') {
      sql += ' WHERE lr.patient_id IN (SELECT id FROM patients WHERE user_id = ?)';
      params.push(req.user.id);
    }
    sql += ' ORDER BY lr.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab requests' });
  }
});

router.post('/', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { consultation_id, patient_id, test_name, test_type, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO lab_requests (consultation_id, patient_id, doctor_id, test_name, test_type, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [consultation_id || null, patient_id, req.user.id, test_name, test_type || 'blood', notes || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Lab request created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lab request' });
  }
});

router.patch('/:id', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const { status, results, notes } = req.body;
    const updates = [];
    const values = [];
    if (status) { updates.push('status = ?'); values.push(status); }
    if (results !== undefined) { updates.push('results = ?'); values.push(results); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (status === 'completed') { updates.push('completed_at = NOW()'); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    await pool.query(`UPDATE lab_requests SET ${updates.join(', ')} WHERE id = ?`, values);

    if (status === 'completed' && results) {
      const [[lab]] = await pool.query('SELECT patient_id FROM lab_requests WHERE id = ?', [req.params.id]);
      if (lab) {
        await pool.query(
          `INSERT INTO notifications (patient_id, channel, type, subject, message, status, sent_at)
           VALUES (?, 'in_app', 'lab_result', 'Lab Results Available', ?, 'sent', NOW())`,
          [lab.patient_id, `Your lab results for request #${req.params.id} are now available.`]
        );
      }
    }
    res.json({ message: 'Lab request updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lab request' });
  }
});

export default router;
