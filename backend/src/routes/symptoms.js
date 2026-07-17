import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { assessSymptoms } from '../utils/symptomAI.js';

const router = express.Router();

router.post('/check', authenticate, async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms?.trim()) return res.status(400).json({ error: 'Symptoms required' });

    const result = assessSymptoms(symptoms);
    const [insert] = await pool.query(
      'INSERT INTO symptom_checks (user_id, symptoms, ai_assessment, urgency_level) VALUES (?, ?, ?, ?)',
      [req.user.id, symptoms, result.ai_assessment, result.urgency_level]
    );

    res.json({ id: insert.insertId, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Symptom check failed' });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM symptom_checks WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
