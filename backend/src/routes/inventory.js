import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventory ORDER BY item_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.post('/', authenticate, authorize('admin', 'nurse'), async (req, res) => {
  try {
    const { item_name, item_type, quantity, unit, reorder_level, expiry_date } = req.body;
    const [result] = await pool.query(
      'INSERT INTO inventory (item_name, item_type, quantity, unit, reorder_level, expiry_date) VALUES (?, ?, ?, ?, ?, ?)',
      [item_name, item_type || 'medication', quantity, unit || 'pcs', reorder_level || 10, expiry_date || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

router.patch('/:id', authenticate, authorize('admin', 'nurse'), async (req, res) => {
  try {
    const { quantity } = req.body;
    await pool.query('UPDATE inventory SET quantity = ? WHERE id = ?', [quantity, req.params.id]);
    res.json({ message: 'Inventory updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

export default router;
