/**
 * auth.js — Authentication routes.
 * POST /api/auth/login         — email + password → JWT
 * POST /api/auth/request-otp  — phone → generate OTP (logged to console in dev)
 * POST /api/auth/verify-otp   — phone + OTP → JWT
 * GET  /api/auth/me            — return current user from token
 */
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { JWT_SECRET, JWT_EXPIRES_IN, OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } = require('../config');

const router = express.Router();

function generateOtp()       { return String(Math.floor(100000 + Math.random() * 900000)); }
function generateToken(emp)  { return jwt.sign({ id: emp.id, email: emp.email, role: emp.role, name: emp.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }); }
function safeEmp({ password, ...rest }) { return rest; }

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const emp = db.findOne('employees', e => e.email === email.toLowerCase().trim() && e.is_active);
  if (!emp || !bcrypt.compareSync(password, emp.password))
    return res.status(401).json({ error: 'Invalid email or password' });

  return res.json({ success: true, token: generateToken(emp), user: safeEmp(emp) });
});

// ── POST /api/auth/request-otp ────────────────────────────────────────────
router.post('/request-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const emp = db.findOne('employees', e => e.phone === String(phone).trim() && e.is_active);
  if (!emp) return res.status(404).json({ error: 'Phone number not registered' });

  const otp       = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  db.upsert('otp_codes', r => r.phone === String(phone).trim(),
    { phone: String(phone).trim(), otp, expires_at: expiresAt, attempts: 0 });

  // In production: send real SMS here. For demo: log to console.
  console.log(`\n[OTP] Phone: ${phone}  →  OTP: ${otp}  (valid ${OTP_EXPIRY_MINUTES} min)\n`);

  return res.json({
    success: true,
    message: `OTP sent to ${phone}`,
    _dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
  });
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────
router.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const record = db.findOne('otp_codes', r => r.phone === String(phone).trim());
  if (!record) return res.status(400).json({ error: 'No OTP requested for this number' });

  if (new Date(record.expires_at) < new Date()) {
    db.remove('otp_codes', r => r.phone === String(phone).trim());
    return res.status(400).json({ error: 'OTP expired. Request a new one.' });
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    db.remove('otp_codes', r => r.phone === String(phone).trim());
    return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' });
  }
  if (record.otp !== String(otp).trim()) {
    db.update('otp_codes', r => r.phone === String(phone).trim(), { attempts: record.attempts + 1 });
    const left = OTP_MAX_ATTEMPTS - record.attempts - 1;
    return res.status(400).json({ error: `Incorrect OTP. ${left} attempt${left !== 1 ? 's' : ''} remaining.` });
  }

  db.remove('otp_codes', r => r.phone === String(phone).trim());
  const emp = db.findOne('employees', e => e.phone === String(phone).trim() && e.is_active);
  return res.json({ success: true, token: generateToken(emp), user: safeEmp(emp) });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const emp = db.findOne('employees', e => e.id === req.user.id && e.is_active);
  if (!emp) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: safeEmp(emp) });
});

module.exports = router;
