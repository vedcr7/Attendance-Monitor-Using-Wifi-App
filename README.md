# WiFi Track Attendance — Backend API

Node.js + Express REST API for the WiFi Track Attendance app.

## Start
```bash
npm install
node src/server.js
```

## Environment Variables
- `PORT` — default 3000
- `JWT_SECRET` — change in production

## Endpoints
- POST /api/auth/login
- POST /api/auth/request-otp
- POST /api/auth/verify-otp
- GET  /api/auth/me
- GET  /api/employees
- POST /api/employees
- GET  /api/attendance
- GET  /api/attendance/today
- POST /api/attendance
- GET  /api/routers
- POST /api/routers
