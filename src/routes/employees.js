/**
 * employees.js — Employee CRUD routes.
 */
const express = require('express');
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db      = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const safe = ({ password, ...rest }) => rest;

// GET /api/employees — all (admin) or self (employee)
router.get('/', requireAdmin, (req, res) => {
  const employees = db.findMany('employees').map(safe);
  return res.json({ employees });
});

// GET /api/employees/:id
router.get('/:id', (req, res) => {
  if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id)
    return res.status(403).json({ error: 'Access denied' });
  const emp = db.findOne('employees', e => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: 'Not found' });
  return res.json({ employee: safe(emp) });
});

// POST /api/employees
router.post('/', requireAdmin, (req, res) => {
  const { name, email, phone, password, role, department } = req.body;
  if (!name || !email || !phone || !password || !role)
    return res.status(400).json({ error: 'name, email, phone, password, role required' });

  const exists = db.findOne('employees', e => e.email === email.toLowerCase() || e.phone === phone);
  if (exists) return res.status(409).json({ error: 'Email or phone already registered' });

  const emp = {
    id: `emp_${uuidv4().slice(0, 8)}`,
    name: name.trim(), email: email.toLowerCase().trim(),
    phone: phone.trim(), password: bcrypt.hashSync(password, 10),
    role, department: department || null,
    is_active: true, created_at: new Date().toISOString(),
  };
  db.insert('employees', emp);
  return res.status(201).json({ success: true, employee: safe(emp) });
});

// PUT /api/employees/:id
router.put('/:id', requireAdmin, (req, res) => {
  const { name, department, role } = req.body;
  const updated = db.update('employees', e => e.id === req.params.id,
    { ...(name && { name }), ...(department && { department }), ...(role && { role }) });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  return res.json({ success: true, employee: safe(updated) });
});

// DELETE /api/employees/:id (soft delete)
router.delete('/:id', requireAdmin, (req, res) => {
  db.update('employees', e => e.id === req.params.id, { is_active: false });
  return res.json({ success: true });
});

module.exports = router;
