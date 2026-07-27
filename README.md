<div align="center">

# 📡 WiFi Track — Attendance Monitoring System

**A React Native application that uses WiFi router fingerprinting (BSSID) to automatically track employee attendance — no manual check-ins required.**

[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)
[![Android](https://img.shields.io/badge/Android-arm64--v8a-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

---

### 🌐 Live Backend
> The backend API is currently **live and running** on Railway's free trial period.
>
> **Base URL:** `https://attendance-monitor-using-wifi-app-production.up.railway.app`
>
> **Health Check:** [/health](https://attendance-monitor-using-wifi-app-production.up.railway.app/health)
>
> ⚠️ *Running on Railway's free tier — available until the trial period ends. Self-host using the instructions below to run it permanently.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Screenshots & Flow](#-screenshots--flow)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Demo Credentials](#-demo-credentials)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## 🎯 Overview

WiFi Track eliminates manual attendance by using the **BSSID (MAC address) of your office WiFi router** as a unique identifier. When an employee's phone connects to a trusted office router, they are automatically marked **PRESENT**. Disconnection starts a grace timer — short breaks are allowed, extended absence is flagged.

> **Why BSSID instead of SSID?**
> Anyone can name their hotspot "Office_WiFi". A BSSID is the hardware MAC address of the physical access point — unique per device and extremely difficult to spoof.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Smart Authentication** | Email/password login + Phone OTP (dev mode shows OTP on screen) |
| 📡 **Real-time WiFi Monitoring** | Polls WiFi every 3 seconds — SSID, BSSID, RSSI, frequency, IP |
| 🏢 **Router Verification** | Compares BSSID against admin-managed trusted router whitelist |
| ⏱️ **Attendance State Machine** | PRESENT → BREAK → AWAY with configurable grace periods |
| ☕ **Break Classification** | Auto-classifies: Short / Tea / Lunch / Extended based on duration |
| 📊 **Attendance Reports** | Daily records with session time, break count, connected duration |
| 📤 **CSV Export** | Share attendance data via email/WhatsApp from the report screen |
| 👥 **Employee Management** | Admin CRUD for employee profiles stored on the backend |
| 📱 **Session Persistence** | Sessions survive app kills — restored on next open |
| 🔄 **Auto-login** | JWT stored in encrypted storage — no re-login needed |
| 🌐 **Cloud Backend** | REST API on Railway — works without your PC running |

---

## ⚙️ How It Works

```
Phone connects to WiFi
        ↓
App reads BSSID every 3 seconds (WifiManager + Kotlin native module)
        ↓
BSSID compared against trusted router list
        ↓
  ┌─────────────────────────────────────────┐
  │  BSSID matches → PRESENT ✅             │
  │  BSSID doesn't match → NOT VERIFIED ❌  │
  └─────────────────────────────────────────┘
        ↓
On disconnect:
  • < 10 min  → Short break (ignored)
  • < 20 min  → Tea break
  • < 60 min  → Lunch break
  • > 120 min → AWAY (session ends)
        ↓
Session data pushed to Railway backend
        ↓
Admin views real-time reports for all employees
```

---

## 🛠 Tech Stack

### Mobile App
| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.86.0 | Mobile framework |
| TypeScript | 5.8.3 | Type safety |
| React Navigation | v7 | Screen navigation |
| React Native Paper | v5 | Material UI components |
| Kotlin Native Module | — | Direct WifiManager/ConnectivityManager access |
| AsyncStorage | v3 | Local session persistence |
| EncryptedStorage | v4 | Secure JWT token storage |
| Axios | — | HTTP client for backend API |
| Zustand | v5 | State management |
| React Native Reanimated | v4 | Smooth animations |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| JSON file database | Zero-dependency persistent storage |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| CORS | Cross-origin requests from mobile app |

### Infrastructure
| Service | Purpose |
|---|---|
| Railway | Cloud hosting (free tier) |
| GitHub | Source control |

---

## 📱 Screenshots & Flow

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  LOGIN       │    │   DASHBOARD      │    │  ATTENDANCE REPORT   │
│              │    │                  │    │                      │
│ 📡 WiFi Track│───▶│ ✅ PRESENT       │───▶│ 📊 7h 30m connected  │
│              │    │ 🏢 VERIFIED      │    │ ☕ 2 breaks (45m)    │
│ Email + Pass │    │ 📶 Signal: Good  │    │ 📤 Export CSV        │
│ or Phone OTP │    │ 🕐 Event Log     │    │                      │
└──────────────┘    └──────────────────┘    └──────────────────────┘
```

### Attendance Status Colors
| Status | Color | Meaning |
|---|---|---|
| ✅ PRESENT | 🟢 Green | Connected to trusted router |
| ☕ ON BREAK | 🟠 Orange | Disconnected < 60 min |
| ⚠️ AWAY | 🔴 Red | Disconnected > 120 min |
| 📵 DISCONNECTED | ⚫ Grey | WiFi off or unknown network |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 22
- Android Studio + Android SDK
- Java 17
- React Native CLI

### 1. Clone the repository
```bash
git clone https://github.com/vedcr7/Attendance-Monitor-Using-Wifi-App.git
cd Attendance-Monitor-Using-Wifi-App
```

### 2. Install React Native dependencies
```bash
npm install
```

### 3. Configure the API URL

Open `src/services/apiClient.ts` and set your backend URL:

```typescript
// For the live Railway backend (works immediately):
export const API_BASE_URL = 'https://attendance-monitor-using-wifi-app-production.up.railway.app';

// For local development (emulator):
export const API_BASE_URL = 'http://10.0.2.2:3000';

// For local development (physical device — replace with your PC's WiFi IP):
export const API_BASE_URL = 'http://192.168.1.X:3000';
```

### 4. Run the app

```bash
# Start Metro bundler
npx react-native start

# Run on connected Android device/emulator (in a new terminal)
npx react-native run-android
```

### 5. Build a debug APK

```bash
cd android
.\gradlew.bat assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📁 Project Structure

```
├── android/                    # Android native code
│   └── app/src/main/java/
│       └── com/wifi_track_attendance/
│           ├── WifiModule.kt   # Kotlin native WiFi bridge
│           └── WifiPackage.kt  # Module registration
│
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── AttendanceStatusCard.tsx
│   │   ├── RouterVerificationCard.tsx
│   │   ├── ConnectionHealthCard.tsx
│   │   ├── EventLogCard.tsx
│   │   └── SignalMeter.tsx
│   │
│   ├── config/
│   │   ├── attendanceConfig.ts # Timing constants (grace periods, break limits)
│   │   └── trustedRouters.ts   # Office router BSSID whitelist
│   │
│   ├── hooks/
│   │   ├── useWifiMonitor.ts   # 3s polling + event tracking
│   │   ├── useRouterVerification.ts  # BSSID → trusted list check
│   │   ├── useAttendanceState.ts     # State machine + break timer
│   │   └── useAuth.ts          # JWT session management
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx     # Email/password + OTP login
│   │   ├── DashboardScreen.tsx # Main attendance dashboard
│   │   ├── AttendanceReportScreen.tsx
│   │   ├── AdminRouterScreen.tsx
│   │   └── EmployeeProfileScreen.tsx
│   │
│   ├── services/
│   │   ├── apiClient.ts        # Axios instance + JWT interceptor
│   │   ├── authService.ts      # Login, OTP, token storage
│   │   ├── attendanceApiService.ts
│   │   └── storageService.ts   # AsyncStorage CRUD
│   │
│   ├── native/
│   │   └── WifiModule.ts       # TypeScript bridge to Kotlin module
│   │
│   └── types/index.ts          # All TypeScript interfaces
│
└── backend/                    # Node.js REST API
    ├── src/
    │   ├── db/
    │   │   ├── database.js     # JSON file database engine
    │   │   └── seed.js         # Demo data seeder
    │   ├── middleware/auth.js   # JWT verification
    │   ├── routes/
    │   │   ├── auth.js         # Login + OTP endpoints
    │   │   ├── employees.js    # Employee CRUD
    │   │   ├── attendance.js   # Attendance records
    │   │   └── routers.js      # Trusted router management
    │   └── server.js
    ├── db.json                 # Live database file
    └── package.json
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/request-otp` | Request OTP for phone number |
| POST | `/api/auth/verify-otp` | Verify OTP, returns JWT |
| GET | `/api/auth/me` | Get current user from token |

### Employees (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Deactivate employee |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/attendance` | Records (admin: all, employee: own) |
| GET | `/api/attendance/today` | Today's overview with present/absent |
| GET | `/api/attendance/summary` | Stats for date range |
| POST | `/api/attendance` | Save/update daily record |

### Routers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/routers` | List trusted routers |
| POST | `/api/routers` | Add router (admin) |
| PUT | `/api/routers/:id` | Update router (admin) |
| DELETE | `/api/routers/:id` | Remove router (admin) |

---

## 🔑 Demo Credentials

| Role | Email | Password | Phone (OTP) |
|---|---|---|---|
| 👔 Admin | admin@company.com | Admin@123 | 9000000001 |
| 👤 Employee | alice@company.com | Pass@123 | 9000000002 |
| 👤 Employee | bob@company.com | Pass@123 | 9000000003 |
| 👤 Employee | carol@company.com | Pass@123 | 9000000004 |

> **OTP Note:** In development mode the OTP appears in a yellow box on the login screen — no SMS service needed for testing.

---

## 🌐 Deployment

### Backend is live on Railway
```
https://attendance-monitor-using-wifi-app-production.up.railway.app
```
> ⚠️ **Railway Free Trial Notice:** This backend is hosted on Railway's free trial period. The service is live and fully functional until the trial expires. To keep it running permanently, upgrade to Railway's hobby plan ($5/month) or self-host using the instructions below.

### Self-host the backend

```bash
cd backend
npm install
node src/server.js
# Server runs on port 3000
```

### Deploy your own Railway instance

1. Fork this repository
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your fork → deploy
4. Add environment variable: `JWT_SECRET=your_secret_key`
5. Generate a public domain in Settings → Networking
6. Update `src/services/apiClient.ts` with your new URL
7. Rebuild the APK

---

## 🗺️ Roadmap

- [ ] Real SMS OTP via Fast2SMS / Twilio
- [ ] Admin live dashboard — see all employees' status in real-time
- [ ] Multiple office location support
- [ ] Geofencing as secondary verification layer
- [ ] Monthly attendance summary PDF export
- [ ] Push notifications for AWAY status
- [ ] PostgreSQL migration for production scale
- [ ] iOS support

---

## 🏗️ Android Permissions Required

```xml
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />  <!-- Android 12+ -->
<uses-permission android:name="android.permission.INTERNET" />
```

> **Why location permission?** Android requires `ACCESS_FINE_LOCATION` to read WiFi SSID/BSSID — it's an OS-level privacy requirement since Android 8.1. The app does not collect or transmit GPS location data.

---

## 📄 License

**Proprietary — All Rights Reserved**

Copyright © 2026 Vedaansh Gupta

This software is the exclusive property of Vedaansh Gupta. Commercial use, redistribution, or modification without written permission is strictly prohibited.

For licensing inquiries: **vedaanshgupta0405@gmail.com**

See the [LICENSE](LICENSE) file for full terms.

---

<div align="center">

**Built with ❤️ using React Native + Kotlin + Node.js**

*WiFi Track — Because attendance should be automatic.*

</div>
