import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { isEmailConfigured, sendEmail, buildBrandedEmail } from '../services/email.js';

const router = express.Router();

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function ensureResetTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY (user_id),
      KEY (token_hash),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    phone: user.phone || null,
  };
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows] = await pool.query(
      `SELECT id, username, email, password_hash, role, full_name, phone
       FROM users WHERE (username = ? OR email = ?) AND is_active = 1`,
      [username, username]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to sign in. Please try again.' });
  }
});

/** Patient self-registration */
router.post('/register', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      full_name, username, email, phone, password, confirm_password,
      school_id, patient_type = 'student', birth_date, gender,
    } = req.body;

    if (!full_name?.trim() || !username?.trim() || !email?.trim() || !password || !school_id?.trim()) {
      return res.status(400).json({ error: 'Please complete all required fields' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const [existing] = await conn.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim().toLowerCase()]
    );
    if (existing[0]) {
      return res.status(409).json({ error: 'Username or email is already registered' });
    }

    const [existingPatient] = await conn.query(
      'SELECT id FROM patients WHERE school_id = ? LIMIT 1',
      [school_id.trim()]
    );
    if (existingPatient[0]) {
      return res.status(409).json({ error: 'School ID is already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    await conn.beginTransaction();

    const [userResult] = await conn.query(
      `INSERT INTO users (username, email, password_hash, role, full_name, phone)
       VALUES (?, ?, ?, 'patient', ?, ?)`,
      [username.trim(), email.trim().toLowerCase(), hash, full_name.trim(), phone?.trim() || null]
    );

    await conn.query(
      `INSERT INTO patients (user_id, school_id, patient_type, birth_date, gender)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userResult.insertId,
        school_id.trim(),
        ['student', 'faculty', 'staff'].includes(patient_type) ? patient_type : 'student',
        birth_date || null,
        gender || null,
      ]
    );

    await conn.commit();

    const user = {
      id: userResult.insertId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role: 'patient',
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
    };

    res.status(201).json({
      message: 'Account created successfully',
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username, email, or school ID already exists' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  } finally {
    conn.release();
  }
});

/** Request password reset */
router.post('/forgot-password', async (req, res) => {
  try {
    await ensureResetTable();
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const generic = {
      message: 'If an account exists for that email, password reset instructions have been sent.',
    };

    const [rows] = await pool.query(
      'SELECT id, email, full_name FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.json(generic);

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(token);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query('DELETE FROM password_resets WHERE user_id = ? OR expires_at < NOW()', [user.id]);
    await pool.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expires]
    );

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontend}/reset-password?token=${token}`;

    let emailed = false;
    if (isEmailConfigured()) {
      const html = buildBrandedEmail({
        title: 'Reset Your Password',
        bodyHtml: `
          <p style="margin:0 0 12px;">Hello ${user.full_name},</p>
          <p style="margin:0 0 16px;">We received a request to reset your NEMSU HealthHub password. This link expires in <strong>1 hour</strong>.</p>
          <p style="margin:0 0 20px;">
            <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#0B3D91;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">
              Reset Password
            </a>
          </p>
          <p style="margin:0;font-size:13px;color:#64748b;">If you did not request this, you can ignore this email.</p>
        `,
      });
      const result = await sendEmail({
        to: user.email,
        subject: 'NEMSU HealthHub — Password Reset',
        text: `Reset your password: ${resetUrl}`,
        html,
      });
      emailed = result.success;
    }

    res.json({
      ...generic,
      emailed,
      // Local/dev helper when SMTP is not configured
      ...(emailed ? {} : { resetUrl, notice: 'SMTP not configured — use the reset link below (local development).' }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to process password reset request' });
  }
});

/** Complete password reset */
router.post('/reset-password', async (req, res) => {
  try {
    await ensureResetTable();
    const { token, password, confirm_password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const [rows] = await pool.query(
      `SELECT pr.id, pr.user_id FROM password_resets pr
       WHERE pr.token_hash = ? AND pr.used_at IS NULL AND pr.expires_at > NOW()
       LIMIT 1`,
      [hashResetToken(token)]
    );
    const reset = rows[0];
    if (!reset) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, reset.user_id]);
    await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);

    res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to reset password' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, role, full_name, phone FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
