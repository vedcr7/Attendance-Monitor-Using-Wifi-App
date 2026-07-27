/**
 * routers.js — Trusted router management.
 * GET    /api/routers       — list active routers (all authenticated)
 * POST   /api/routers       — add router (admin only)
 * PUT    /api/routers/:id   — update router (admin only)
 * DELETE /api/routers/:id   — soft-delete router (admin only)
 */
const express = require('express');
const db      = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const routers = db.findMany('trusted_routers', r => r.is_active !== false);
  return res.json({ routers });
});

router.post('/', requireAdmin, (req, res) => {
  const { name, bssid, location } = req.body;
  if (!name || !bssid) return res.status(400).json({ error: 'name and bssid are required' });

  const exists = db.findOne('trusted_routers', r => r.bssid.toUpperCase() === bssid.toUpperCase());
  if (exists) return res.status(409).json({ error: 'BSSID already exists' });

  const all = db.findMany('trusted_routers');
  const nextId = all.length > 0 ? Math.max(...all.map(r => r.id)) + 1 : 1;
  const entry = { id: nextId, name: name.trim(), bssid: bssid.toUpperCase().trim(), location: location || null, is_active: true };
  db.insert('trusted_routers', entry);
  return res.status(201).json({ success: true, router: entry });
});

router.put('/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, bssid, location } = req.body;
  const updated = db.update('trusted_routers', r => r.id === id, {
    ...(name     && { name: name.trim() }),
    ...(bssid    && { bssid: bssid.toUpperCase().trim() }),
    ...(location !== undefined && { location }),
  });
  if (!updated) return res.status(404).json({ error: 'Router not found' });
  return res.json({ success: true, router: updated });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.update('trusted_routers', r => r.id === id, { is_active: false });
  return res.json({ success: true });
});

module.exports = router;
