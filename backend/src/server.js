/**
 * server.js — Express app entry point.
 *
 * Start:  node src/server.js
 * Dev:    npx nodemon src/server.js
 *
 * Endpoints:
 *   POST /api/auth/login
 *   POST /api/auth/request-otp
 *   POST /api/auth/verify-otp
 *   GET  /api/auth/me
 *   GET  /api/employees
 *   POST /api/employees
 *   GET  /api/attendance
 *   GET  /api/attendance/today
 *   POST /api/attendance
 *   GET  /api/routers
 *   POST /api/routers
 */
const express = require('express');
const cors    = require('cors');
const { PORT } = require('./config');
const { seedDatabase } = require('./db/seed');

// Route handlers
const authRoutes       = require('./routes/auth');
const employeeRoutes   = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const routerRoutes     = require('./routes/routers');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors()); // Allow React Native app to connect
app.use(express.json());

// Request logger (dev only)
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/employees',  employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/routers',    routerRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start ──────────────────────────────────────────────────────────────────
seedDatabase(); // Seed dummy data if DB is empty

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 WiFi Track API running on http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Auth:   POST http://localhost:${PORT}/api/auth/login\n`);
});
