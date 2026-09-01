/**
 * attendance.js — Attendance record routes.
 */
const express = require('express');
const db      = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/attendance — all (admin) or own (employee), with optional ?date=&from=&to=
router.get('/', (req, res) => {
  const { date, from, to } = req.query;

  let records = db.findMany('attendance_records', r => {
    const byEmp = req.user.role === 'ADMIN' || r.employee_id === req.user.id;
    const byDate = !date || r.date === date;
    const byFrom = !from  || r.date >= from;
    const byTo   = !to    || r.date <= to;
    return byEmp && byDate && byFrom && byTo;
  });

  records.sort((a, b) => b.date.localeCompare(a.date));
  return res.json({ records, total: records.length });
});

// GET /api/attendance/today — admin overview
router.get('/today', requireAdmin, (req, res) => {
  const today   = new Date().toISOString().split('T')[0];
  const present = db.findMany('attendance_records', r => r.date === today);
  const presentIds = present.map(r => r.employee_id);
  const allEmps    = db.findMany('employees',          e => e.role === 'EMPLOYEE' && e.is_active);
  const absent     = allEmps
    .filter(e => !presentIds.includes(e.id))
    .map(e => ({ employee_id: e.id, employee_name: e.name, employee_email: e.email, status: 'ABSENT', date: today }));

  return res.json({
    date: today,
    present,
    absent,
    summary: { total: allEmps.length, present: present.length, absent: absent.length },
  });
});

// GET /api/attendance/summary — admin stats
router.get('/summary', requireAdmin, (req, res) => {
  const fromDate = req.query.from || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const toDate   = req.query.to   || new Date().toISOString().split('T')[0];

  const allEmps = db.findMany('employees', e => e.role === 'EMPLOYEE' && e.is_active);
  const stats = allEmps.map(emp => {
    const recs = db.findMany('attendance_records',
      r => r.employee_id === emp.id && r.date >= fromDate && r.date <= toDate);
    return {
      id:              emp.id,
      name:            emp.name,
      department:      emp.department,
      days_present:    recs.length,
      total_connected: recs.reduce((s, r) => s + (r.connected_duration_ms || 0), 0),
      total_breaks:    recs.reduce((s, r) => s + (r.total_break_ms || 0), 0),
    };
  });

  return res.json({ from: fromDate, to: toDate, employees: stats });
});

// GET /api/attendance/employee/:id
router.get('/employee/:id', (req, res) => {
  if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id)
    return res.status(403).json({ error: 'Access denied' });
  const records = db.findMany('attendance_records', r => r.employee_id === req.params.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);
  return res.json({ records });
});

// POST /api/attendance — upsert daily record
router.post('/', (req, res) => {
  const { date, session_start, session_end, connected_duration_ms,
          total_break_ms, break_count, breaks, status } = req.body;
  if (!date || !status) return res.status(400).json({ error: 'date and status required' });

  const emp = db.findOne('employees', e => e.id === req.user.id);
  const id  = `rec_${req.user.id}_${date.replace(/-/g, '')}`;

  const record = {
    id,
    employee_id:           req.user.id,
    employee_name:         req.user.name,
    employee_email:        req.user.email,
    date,
    session_start:         session_start  || null,
    session_end:           session_end    || null,
    connected_duration_ms: connected_duration_ms || 0,
    total_break_ms:        total_break_ms        || 0,
    break_count:           break_count           || 0,
    breaks:                breaks                || [],
    status,
    updated_at: new Date().toISOString(),
  };

  db.upsert('attendance_records',
    r => r.employee_id === req.user.id && r.date === date, record);

  return res.status(201).json({ success: true, id });
});

module.exports = router;
