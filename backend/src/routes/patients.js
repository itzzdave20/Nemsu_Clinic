import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.full_name as linked_user
      FROM patients p LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

/** Patient portal — own EHR, appointments, prescriptions, labs, referrals */
router.get('/me/portal', authenticate, async (req, res) => {
  try {
    const [patients] = await pool.query(
      `SELECT p.*, u.full_name, u.email, u.phone
       FROM patients p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (!patients[0]) {
      return res.status(404).json({ error: 'No patient profile linked to this account' });
    }

    const patient = patients[0];
    const pid = patient.id;

    const [appointments] = await pool.query(`
      SELECT a.*, d.full_name as doctor_name
      FROM appointments a
      LEFT JOIN users d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.visit_date DESC, a.visit_time DESC
      LIMIT 20
    `, [pid]);

    const [consultations] = await pool.query(`
      SELECT c.*, u.full_name as doctor_name
      FROM consultations c
      JOIN users u ON c.doctor_id = u.id
      WHERE c.patient_id = ?
      ORDER BY c.created_at DESC
      LIMIT 20
    `, [pid]);

    const [prescriptions] = await pool.query(`
      SELECT pr.*, u.full_name as doctor_name
      FROM prescriptions pr
      JOIN users u ON pr.doctor_id = u.id
      WHERE pr.patient_id = ?
      ORDER BY pr.created_at DESC
      LIMIT 20
    `, [pid]);

    const [labs] = await pool.query(`
      SELECT lr.*, u.full_name as doctor_name
      FROM lab_requests lr
      JOIN users u ON lr.doctor_id = u.id
      WHERE lr.patient_id = ?
      ORDER BY lr.created_at DESC
      LIMIT 20
    `, [pid]);

    const [referrals] = await pool.query(`
      SELECT r.*, u.full_name as doctor_name
      FROM referrals r
      JOIN users u ON r.doctor_id = u.id
      WHERE r.patient_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `, [pid]);

    const [notifications] = await pool.query(`
      SELECT * FROM notifications
      WHERE patient_id = ? OR user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [pid, req.user.id]);

    res.json({
      profile: patient,
      appointments,
      consultations,
      prescriptions,
      labs,
      referrals,
      notifications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load patient portal' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.full_name as linked_user
      FROM patients p LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'Patient not found' });

    const [consultations] = await pool.query(`
      SELECT c.*, u.full_name as doctor_name
      FROM consultations c JOIN users u ON c.doctor_id = u.id
      WHERE c.patient_id = ? ORDER BY c.created_at DESC
    `, [req.params.id]);

    res.json({ ...rows[0], consultations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

router.post('/', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const { school_id, patient_type, birth_date, gender, blood_type, address, emergency_contact, emergency_phone, allergies, medical_history } = req.body;
    const [result] = await pool.query(
      `INSERT INTO patients (school_id, patient_type, birth_date, gender, blood_type, address, emergency_contact, emergency_phone, allergies, medical_history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [school_id, patient_type, birth_date || null, gender || null, blood_type || null, address || null, emergency_contact || null, emergency_phone || null, allergies || null, medical_history || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Patient registered' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'School ID already exists' });
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

router.put('/:id', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const fields = ['patient_type', 'birth_date', 'gender', 'blood_type', 'address', 'emergency_contact', 'emergency_phone', 'allergies', 'medical_history'];
    const updates = [];
    const values = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    await pool.query(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Patient updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

export default router;
