/**
 * seed.js — Populate db.json with demo data on first run.
 *
 * Demo credentials:
 *   Admin:      admin@company.com  / Admin@123  / phone: 9000000001
 *   Employee 1: alice@company.com  / Pass@123   / phone: 9000000002
 *   Employee 2: bob@company.com    / Pass@123   / phone: 9000000003
 *   Employee 3: carol@company.com  / Pass@123   / phone: 9000000004
 *   Employee 4: david@company.com  / Pass@123   / phone: 9000000005
 */
const bcrypt = require('bcryptjs');
const db     = require('./database');

function seedDatabase() {
  // Skip if already seeded
  if (db.count('employees') > 0) return;

  console.log('[Seed] Populating database with dummy data...');

  const hashedAdmin = bcrypt.hashSync('Admin@123', 10);
  const hashedUser  = bcrypt.hashSync('Pass@123',  10);

  // ── Employees ────────────────────────────────────────────────────────────
  const employees = [
    { id: 'emp_001', name: 'Admin User',    email: 'admin@company.com', phone: '9000000001', password: hashedAdmin, role: 'ADMIN',    department: 'Management',   is_active: true, created_at: new Date().toISOString() },
    { id: 'emp_002', name: 'Alice Johnson', email: 'alice@company.com', phone: '9000000002', password: hashedUser,  role: 'EMPLOYEE', department: 'Engineering',  is_active: true, created_at: new Date().toISOString() },
    { id: 'emp_003', name: 'Bob Smith',     email: 'bob@company.com',   phone: '9000000003', password: hashedUser,  role: 'EMPLOYEE', department: 'Engineering',  is_active: true, created_at: new Date().toISOString() },
    { id: 'emp_004', name: 'Carol White',   email: 'carol@company.com', phone: '9000000004', password: hashedUser,  role: 'EMPLOYEE', department: 'Design',       is_active: true, created_at: new Date().toISOString() },
    { id: 'emp_005', name: 'David Brown',   email: 'david@company.com', phone: '9000000005', password: hashedUser,  role: 'EMPLOYEE', department: 'Sales',        is_active: true, created_at: new Date().toISOString() },
  ];
  employees.forEach(e => db.insert('employees', e));

  // ── Trusted routers ───────────────────────────────────────────────────────
  db.insert('trusted_routers', { id: 1, name: 'Office Router Main',    bssid: 'AA:BB:CC:DD:EE:FF', location: 'Ground Floor', is_active: true });
  db.insert('trusted_routers', { id: 2, name: 'Office Router Floor 1', bssid: '11:22:33:44:55:66', location: 'First Floor',  is_active: true });
  db.insert('trusted_routers', { id: 3, name: 'Office Router Floor 2', bssid: '11:22:33:44:55:77', location: 'Second Floor', is_active: true });

  // ── Sample attendance records (last 5 days) ────────────────────────────
  const sampleEmps = [
    { id: 'emp_002', name: 'Alice Johnson', email: 'alice@company.com' },
    { id: 'emp_003', name: 'Bob Smith',     email: 'bob@company.com'   },
    { id: 'emp_004', name: 'Carol White',   email: 'carol@company.com' },
    { id: 'emp_005', name: 'David Brown',   email: 'david@company.com' },
  ];

  const today = new Date();
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    for (const emp of sampleEmps) {
      const startHour = 8 + Math.floor(Math.random() * 2);
      const startMin  = Math.floor(Math.random() * 30);
      const breakMins = 30 + Math.floor(Math.random() * 60);
      const connectedMs = 7 * 3600 * 1000 - breakMins * 60 * 1000;

      const sessionStart = new Date(date);
      sessionStart.setHours(startHour, startMin, 0, 0);
      const sessionEnd = new Date(date);
      sessionEnd.setHours(18, Math.floor(Math.random() * 60), 0, 0);

      db.insert('attendance_records', {
        id:                    `rec_${emp.id}_${dayOffset}`,
        employee_id:           emp.id,
        employee_name:         emp.name,
        employee_email:        emp.email,
        date:                  dateStr,
        session_start:         sessionStart.toISOString(),
        session_end:           sessionEnd.toISOString(),
        connected_duration_ms: connectedMs,
        total_break_ms:        breakMins * 60 * 1000,
        break_count:           1,
        breaks:                [{ id: `b_${emp.id}_${dayOffset}`, type: 'LUNCH', durationMs: breakMins * 60 * 1000 }],
        status:                'CONNECTED',
        created_at:            new Date().toISOString(),
        updated_at:            new Date().toISOString(),
      });
    }
  }

  console.log('[Seed] ✅ Done.');
  console.log('[Seed] Admin:    admin@company.com / Admin@123  (phone: 9000000001)');
  console.log('[Seed] Employee: alice@company.com / Pass@123   (phone: 9000000002)');
}

module.exports = { seedDatabase };
