<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F2027,50:2C5364,100:00C6FF&height=230&section=header&text=WiFi%20Track&fontSize=64&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=Your%20Router%20Is%20Now%20Your%20Attendance%20Register&descAlignY=58&descSize=19" width="100%"/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=21&pause=1200&color=00C6FF&center=true&vCenter=true&width=680&lines=No+manual+check-ins.+No+GPS+spoofing.;Connect+to+office+WiFi+%E2%86%92+marked+present.;BSSID+fingerprinting+%2B+a+real+state+machine." alt="Typing SVG" />

<br/><br/>

[![React Native](https://img.shields.io/badge/React_Native-0.86.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Kotlin](https://img.shields.io/badge/Kotlin-Native_Module-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![Railway](https://img.shields.io/badge/Deployed_on-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)

<br/>

![PRs Welcome](https://img.shields.io/badge/PRs-welcome-00C6FF?style=flat-square)
![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen?style=flat-square)
<img src="https://img.shields.io/github/stars/vedcr7/Attendance-Monitor-Using-Wifi-App?style=social" alt="stars"/>
<img src="https://img.shields.io/github/forks/vedcr7/Attendance-Monitor-Using-Wifi-App?style=social" alt="forks"/>
<img src="https://img.shields.io/github/last-commit/vedcr7/Attendance-Monitor-Using-Wifi-App?color=00C6FF&style=flat-square" alt="last commit"/>

</div>

<br/>

<div align="center">
<img src="./assets/hero-mockup.svg" width="300" alt="WiFi Track live dashboard mockup — animated"/>
<br/>
<sub><i>Live status card — WiFi confirms the router, the ring tracks connected time, the bars pulse with signal.</i></sub>
</div>

<br/>

> **A React Native app that fingerprints your office router (BSSID) to automatically mark employees PRESENT, ON BREAK, or AWAY — no manual check-ins, no spoofable hotspot names, no GPS required.**

<div align="center">

### 🌐 Live Backend

| | |
|---|---|
| **Status** | ![Status](https://img.shields.io/badge/status-live-brightgreen?style=flat-square) |
| **Base URL** | `attendance-monitor-using-wifi-app-production.up.railway.app` |
| **Health Check** | [`/health`](https://attendance-monitor-using-wifi-app-production.up.railway.app/health) |

⚠️ *Running on Railway's free trial — self-host anytime using the guide below.*

<br/>

<img src="https://github-readme-stats.vercel.app/api/pin/?username=vedcr7&repo=Attendance-Monitor-Using-Wifi-App&theme=tokyonight&hide_border=true&bg_color=0F2027&title_color=00C6FF&text_color=c9d1d9&icon_color=00C6FF" alt="repo card"/>

</div>

---

## 📋 Table of Contents

<table>
<tr>
<td valign="top" width="25%">

**Concept**
- [Overview](#-overview)
- [Why WiFi, Not GPS or Biometrics](#-why-wifi-not-gps-or-biometrics)
- [Key Features](#-key-features)

</td>
<td valign="top" width="25%">

**Architecture**
- [Attendance State Machine](#-attendance-state-machine)
- [Auth Sequence](#-authentication-sequence)
- [Codebase Composition](#-codebase-composition)
- [Tech Stack](#-tech-stack)

</td>
<td valign="top" width="25%">

**Build & Run**
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)

</td>
<td valign="top" width="25%">

**Ops**
- [Security Notes](#-security-notes)
- [Deployment](#-deployment)
- [Roadmap](#️-roadmap)

</td>
</tr>
</table>

---

## 🎯 Overview

Most "smart" attendance systems rely on **GPS geofencing** (easily spoofed by mock-location apps) or **biometric hardware** (expensive, requires physical installation, and still needs someone to walk up and scan). WiFi Track takes a third path: it identifies the **BSSID — the hardware MAC address of the office router itself** — as the trust anchor.

> 💡 **Why BSSID instead of SSID?** Anyone can rename a personal hotspot `Office_WiFi`. A BSSID is burned into the access point's hardware. It can't be renamed, and spoofing it requires cloning a physical device's MAC — a meaningfully higher bar than typing a network name.

When a phone connects to a **trusted** BSSID, the app marks the employee **PRESENT**. Disconnection doesn't instantly flag someone absent — it starts a **grace-period timer**, because someone walking to the printer or stepping out for lunch isn't "away."

---

## ⚖️ Why WiFi, Not GPS or Biometrics

| | GPS Geofencing | Biometric Scanner | 📡 WiFi Track |
|---|:---:|:---:|:---:|
| Spoofable with a free app | ❌ Yes (mock location) | ✅ No | ✅ No |
| Hardware cost | Free | 💰 ₹15k–50k/unit | Free (uses existing router) |
| Works indoors reliably | ❌ Poor (multi-floor buildings) | ✅ Yes | ✅ Yes |
| Requires employee action | ✅ None | ❌ Must walk up & scan | ✅ None (automatic) |
| Tracks precise break duration | ❌ No | ❌ No | ✅ Yes, with auto-classification |
| Setup effort | Low | High (hardware install) | Low (whitelist a BSSID) |

---

## ✨ Key Features

<div align="center">

| | | |
|:---:|:---:|:---:|
| 🔐 **Smart Auth**<br/>Email/password + Phone OTP | 📡 **Real-time Monitoring**<br/>3s polling — SSID, BSSID, RSSI, freq | 🏢 **Router Verification**<br/>BSSID vs. admin-managed whitelist |
| ⏱️ **State Machine**<br/>PRESENT → BREAK → AWAY | ☕ **Break Classification**<br/>Short / Tea / Lunch / Extended | 📊 **Attendance Reports**<br/>Session time, break count, duration |
| 📤 **CSV Export**<br/>Share via email/WhatsApp | 👥 **Employee Management**<br/>Admin CRUD on backend | 📱 **Session Persistence**<br/>Survives app kills |
| 🔄 **Auto-login**<br/>Encrypted JWT storage | 🌐 **Cloud Backend**<br/>REST API, works without a PC running | 🛡️ **Anti-spoof by Design**<br/>Hardware MAC, not a network name |

</div>

---

## 🔄 Attendance State Machine

The actual core logic — a real state machine with timed transitions, not a linear pipeline:

```mermaid
stateDiagram-v2
    [*] --> DISCONNECTED
    DISCONNECTED --> VERIFYING: WiFi connects
    VERIFYING --> PRESENT: BSSID in trusted list
    VERIFYING --> NOT_VERIFIED: BSSID unknown

    PRESENT --> SHORT_BREAK: disconnects
    SHORT_BREAK --> PRESENT: reconnects < 10 min
    SHORT_BREAK --> TEA_BREAK: still gone at 10 min

    TEA_BREAK --> PRESENT: reconnects < 20 min
    TEA_BREAK --> LUNCH_BREAK: still gone at 20 min

    LUNCH_BREAK --> PRESENT: reconnects < 60 min
    LUNCH_BREAK --> AWAY: still gone at 60 min

    AWAY --> [*]: session ends, logged

    NOT_VERIFIED --> DISCONNECTED: WiFi drops
    NOT_VERIFIED --> PRESENT: connects to trusted router

    note right of AWAY
        Session data flushed
        to Railway backend
    end note
```

Every transition is timestamped and pushed to the backend, so an admin's report isn't just "present/absent" — it's a full timeline of connect/disconnect events per employee, per day.

---

## 🔐 Authentication Sequence

```mermaid
sequenceDiagram
    participant U as 📱 Employee App
    participant A as 🔑 Auth Service
    participant B as 🖥️ Backend API
    participant S as 🔒 EncryptedStorage

    U->>A: Email + Password (or Phone OTP)
    A->>B: POST /api/auth/login
    B-->>A: JWT token
    A->>S: Store token (encrypted)
    A-->>U: Login success

    Note over U,B: On every subsequent app launch
    U->>S: Read stored JWT
    S-->>U: Token found
    U->>B: GET /api/auth/me (Bearer token)
    B-->>U: User session restored — no re-login
```

---

## 🥧 Codebase Composition

```mermaid
pie showData
    title Where the Code Lives (by component)
    "Mobile — TS/TSX" : 55
    "Backend — Node/Express" : 30
    "Native — Kotlin" : 10
    "Config & Tooling" : 5
```

<sub><i>Approximate split by component responsibility, not a precise LOC audit.</i></sub>

---

## 🛠 Tech Stack

<div align="center">

**Mobile App**

![React Native](https://skillicons.dev/icons?i=react)
![TypeScript](https://skillicons.dev/icons?i=typescript)
![Kotlin](https://skillicons.dev/icons?i=kotlin)

**Backend & Infra**

![Node.js](https://skillicons.dev/icons?i=nodejs)
![Express](https://skillicons.dev/icons?i=express)
![Railway](https://skillicons.dev/icons?i=railway)

</div>

<details>
<summary><b>📱 Full mobile app dependency table</b></summary>
<br/>

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

</details>

<details>
<summary><b>🖥️ Full backend dependency table</b></summary>
<br/>

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| JSON file database | Zero-dependency persistent storage |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| CORS | Cross-origin requests from mobile app |

</details>

---

## 📱 App Flow

<div align="center">

| 🔑 Login | 🏠 Dashboard | 📊 Report |
|:---:|:---:|:---:|
| Email + Password<br/>or Phone OTP | ✅ PRESENT · 🏢 VERIFIED<br/>📶 Signal: Good · 🕐 Event Log | 7h 30m connected<br/>☕ 2 breaks (45m) · 📤 Export CSV |

### Status Colors

| Status | Color | Meaning |
|---|:---:|---|
| ✅ PRESENT | 🟢 Green | Connected to trusted router |
| ☕ ON BREAK | 🟠 Orange | Disconnected < 60 min |
| ⚠️ AWAY | 🔴 Red | Disconnected > 120 min |
| 📵 DISCONNECTED | ⚫ Grey | WiFi off or unknown network |

</div>

---

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:00C6FF,100:0F2027&height=4&width=100%25" width="100%"/>

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 22
- Android Studio + Android SDK
- Java 17
- React Native CLI

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vedcr7/Attendance-Monitor-Using-Wifi-App.git
cd Attendance-Monitor-Using-Wifi-App

# 2. Install dependencies
npm install
```

### Configure the API URL

Open `src/services/apiClient.ts`:

```ts
// Live Railway backend (works immediately):
export const API_BASE_URL = 'https://attendance-monitor-using-wifi-app-production.up.railway.app';

// Local dev (emulator):
export const API_BASE_URL = 'http://10.0.2.2:3000';

// Local dev (physical device — use your PC's WiFi IP):
export const API_BASE_URL = 'http://192.168.1.X:3000';
```

### Run

```bash
# Start Metro bundler
npx react-native start

# In a new terminal — run on device/emulator
npx react-native run-android
```

### Build a debug APK

```bash
cd android
.\gradlew.bat assembleDebug
```

📦 Output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📁 Project Structure

<details>
<summary><b>Click to expand full directory tree</b></summary>

```
├── android/                          # Android native code
│   └── app/src/main/java/com/wifi_track_attendance/
│       ├── WifiModule.kt             # Kotlin native WiFi bridge
│       └── WifiPackage.kt            # Module registration
│
├── src/
│   ├── components/                   # Reusable UI components
│   │   ├── AttendanceStatusCard.tsx
│   │   ├── RouterVerificationCard.tsx
│   │   ├── ConnectionHealthCard.tsx
│   │   ├── EventLogCard.tsx
│   │   └── SignalMeter.tsx
│   │
│   ├── config/
│   │   ├── attendanceConfig.ts       # Timing constants (grace periods, break limits)
│   │   └── trustedRouters.ts         # Office router BSSID whitelist
│   │
│   ├── hooks/
│   │   ├── useWifiMonitor.ts         # 3s polling + event tracking
│   │   ├── useRouterVerification.ts  # BSSID → trusted list check
│   │   ├── useAttendanceState.ts     # State machine + break timer
│   │   └── useAuth.ts                # JWT session management
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── AttendanceReportScreen.tsx
│   │   ├── AdminRouterScreen.tsx
│   │   └── EmployeeProfileScreen.tsx
│   │
│   ├── services/
│   │   ├── apiClient.ts              # Axios instance + JWT interceptor
│   │   ├── authService.ts            # Login, OTP, token storage
│   │   ├── attendanceApiService.ts
│   │   └── storageService.ts         # AsyncStorage CRUD
│   │
│   ├── native/
│   │   └── WifiModule.ts             # TypeScript bridge to Kotlin module
│   │
│   └── types/index.ts                # All TypeScript interfaces
│
└── backend/                          # Node.js REST API
    ├── src/
    │   ├── db/
    │   │   ├── database.js           # JSON file database engine
    │   │   └── seed.js               # Demo data seeder
    │   ├── middleware/auth.js        # JWT verification
    │   ├── routes/
    │   │   ├── auth.js               # Login + OTP endpoints
    │   │   ├── employees.js          # Employee CRUD
    │   │   ├── attendance.js         # Attendance records
    │   │   └── routers.js            # Trusted router management
    │   └── server.js
    ├── db.json                       # Live database file
    └── package.json
```

</details>

---

## 🔌 API Endpoints

<details open>
<summary><b>🔐 Authentication</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/auth/login` | Email + password login |
| `POST` | `/api/auth/request-otp` | Request OTP for phone number |
| `POST` | `/api/auth/verify-otp` | Verify OTP, returns JWT |
| `GET` | `/api/auth/me` | Get current user from token |

</details>

<details>
<summary><b>👥 Employees (Admin only)</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/api/employees` | List all employees |
| `POST` | `/api/employees` | Create employee |
| `PUT` | `/api/employees/:id` | Update employee |
| `DELETE` | `/api/employees/:id` | Deactivate employee |

</details>

<details>
<summary><b>📊 Attendance</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/api/attendance` | Records (admin: all, employee: own) |
| `GET` | `/api/attendance/today` | Today's overview with present/absent |
| `GET` | `/api/attendance/summary` | Stats for date range |
| `POST` | `/api/attendance` | Save/update daily record |

</details>

<details>
<summary><b>📡 Routers</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/api/routers` | List trusted routers |
| `POST` | `/api/routers` | Add router (admin) |
| `PUT` | `/api/routers/:id` | Update router (admin) |
| `DELETE` | `/api/routers/:id` | Remove router (admin) |

</details>

---

## 🔑 Demo Credentials

| Role | Email | Password | Phone (OTP) |
|---|---|---|---|
| 👔 Admin | `admin@company.com` | `Admin@123` | `9000000001` |
| 👤 Employee | `alice@company.com` | `Pass@123` | `9000000002` |
| 👤 Employee | `bob@company.com` | `Pass@123` | `9000000003` |
| 👤 Employee | `carol@company.com` | `Pass@123` | `9000000004` |

> ℹ️ In dev mode, the OTP appears in a yellow box on the login screen — no SMS service needed for testing.

---

## 🛡️ Security Notes

<div align="center">

| Concern | How it's handled |
|---|---|
| **BSSID spoofing** | Requires cloning a physical device's hardware MAC — far higher bar than renaming an SSID |
| **Token theft** | JWTs live in `EncryptedStorage` (Android Keystore-backed), not plain AsyncStorage |
| **Password storage** | Hashed with `bcryptjs`, never stored or logged in plaintext |
| **Location permission scope** | Required by Android to read WiFi SSID/BSSID (OS policy since 8.1) — the app does **not** collect or transmit GPS coordinates |
| **API authorization** | All non-auth routes require a valid Bearer JWT, verified server-side per request |

> ⚠️ **Known gap:** the current demo backend uses a JSON file as its database (`db.json`) — fine for a prototype, but the [Roadmap](#️-roadmap) includes a PostgreSQL migration before any real production use.

</div>

---

## 🌐 Deployment

**Backend is live on Railway:**
```
https://attendance-monitor-using-wifi-app-production.up.railway.app
```
> ⚠️ Hosted on Railway's free trial — live and functional until the trial expires. Upgrade to the hobby plan ($5/mo) or self-host below to keep it running permanently.

<details>
<summary><b>🖥️ Self-host the backend</b></summary>

```bash
cd backend
npm install
node src/server.js
# Server runs on port 3000
```

</details>

<details>
<summary><b>🚂 Deploy your own Railway instance</b></summary>

1. Fork this repository
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your fork → deploy
4. Add environment variable: `JWT_SECRET=your_secret_key`
5. Generate a public domain in Settings → Networking
6. Update `src/services/apiClient.ts` with your new URL
7. Rebuild the APK

</details>

---

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:FFB020,100:0F2027&height=4&width=100%25" width="100%"/>

## 🗺️ Roadmap

```mermaid
gantt
    title WiFi Track — Planned Milestones
    dateFormat  YYYY-MM-DD
    axisFormat  %b
    section Auth & Alerts
    Real SMS OTP (Twilio/Fast2SMS)      :a1, 2026-08-01, 20d
    Push notifications for AWAY status  :a2, after a1, 15d
    section Admin Experience
    Live admin dashboard                :b1, 2026-08-15, 25d
    Multi-location support              :b2, after b1, 20d
    section Platform Hardening
    Geofencing (secondary verification) :c1, 2026-09-10, 15d
    PostgreSQL migration                :c2, after c1, 20d
    iOS support                         :c3, after c2, 30d
    section Reporting
    Monthly PDF export                  :d1, 2026-09-25, 15d
```

<sub><i>Illustrative timeline for planning purposes — not committed dates.</i></sub>

---

## 🏗️ Android Permissions Required

```xml
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" /> <!-- Android 12+ -->
<uses-permission android:name="android.permission.INTERNET" />
```

> 📍 **Why location permission?** Android requires `ACCESS_FINE_LOCATION` to read WiFi SSID/BSSID — an OS-level privacy requirement since Android 8.1. The app does **not** collect or transmit GPS location data.

---

## ❓ FAQ

<details>
<summary><b>What happens if two office locations use the same router brand?</b></summary>
<br/>
BSSIDs are unique per physical hardware unit — no two routers, even the same model bought on the same day, share a MAC address. Whitelisting is per-BSSID, not per-brand.
</details>

<details>
<summary><b>Can an employee fake presence by connecting from home?</b></summary>
<br/>
No — unlike GPS, there's nothing to spoof remotely. The device has to actually associate with the physical access point's radio, which only happens within real WiFi range of the office.
</details>

<details>
<summary><b>Does the app drain battery from constant polling?</b></summary>
<br/>
The 3-second poll only reads already-cached WiFi state via the native Kotlin module — it doesn't trigger new radio scans, so the drain is comparable to leaving WiFi on, not to active scanning.
</details>

---

## 📄 License

(https://github.com/vedcr7/Attendance-Monitor-Using-Wifi-App/blob/main/LICENSE)

<div align="center">

<br/>

**Built with ❤️ using React Native + Kotlin + Node.js**

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&pause=1500&color=8FA3AD&center=true&vCenter=true&width=440&lines=Thanks+for+stopping+by+%E2%80%94+%E2%AD%90+it+if+it's+useful!" alt="footer typing" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00C6FF,100:0F2027&height=100&section=footer" width="100%"/>

</div>
