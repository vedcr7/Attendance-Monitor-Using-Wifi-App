// ─────────────────────────────────────────────
// Auth types
// ─────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  email: string;
  role: UserRole;
  name: string;
}

// ─────────────────────────────────────────────
// Employee profile types
// ─────────────────────────────────────────────

export interface EmployeeProfile {
  id: string;           // uuid
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;    // ISO date string
}

// ─────────────────────────────────────────────
// WiFi types — mirrors WifiModule.kt output
// ─────────────────────────────────────────────

export interface WifiInfo {
  isConnected: boolean;
  isWifiEnabled: boolean;
  ssid: string;
  bssid: string;
  ipAddress: string;
  rssi: number;
  signalLevel: number; // 0-4
  frequency: number;   // MHz
  band: string;        // '2.4 GHz' | '5 GHz' | '6 GHz' | 'Unknown'
  linkSpeed: number;   // Mbps
  networkId: string;
  hiddenSsid: boolean;
  networkType: string; // 'WiFi' | 'Cellular' | 'Other' | 'None'
  hasInternet: boolean;
  error?: string;
}

// ─────────────────────────────────────────────
// Signal quality types
// ─────────────────────────────────────────────

export type SignalQuality = 'Excellent' | 'Good' | 'Fair' | 'Weak' | 'Poor' | 'No Signal';

export interface SignalCategory {
  label: SignalQuality;
  color: string;
  description: string;
  icon: string;
}

// ─────────────────────────────────────────────
// Device info types
// ─────────────────────────────────────────────

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  androidVersion: string;
  apiLevel: number;
  brand: string;
  isLoading: boolean;
}

// ─────────────────────────────────────────────
// Navigation types
// ─────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Dashboard: { user: AuthUser };
  AdminRouterScreen: { user: AuthUser; currentBssid?: string; currentSsid?: string };
  AttendanceReportScreen: { user: AuthUser };
  EmployeeProfileScreen: { user: AuthUser };
};

// ─────────────────────────────────────────────
// Permission status types
// ─────────────────────────────────────────────

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited';

export interface PermissionState {
  fineLocation: PermissionStatus;
  coarseLocation: PermissionStatus;
  nearbyWifi: PermissionStatus;
  allGranted: boolean;
  isChecking: boolean;
}

// ─────────────────────────────────────────────
// Router verification types
// ─────────────────────────────────────────────

export interface RouterVerificationState {
  isVerified: boolean;
  matchedRouter: { id: number; name: string; bssid: string; location?: string } | null;
  currentBssid: string;
  currentSsid: string;
}

// ─────────────────────────────────────────────
// Attendance state machine types
// ─────────────────────────────────────────────

export type AttendanceStatus =
  | 'UNKNOWN'
  | 'CONNECTED'
  | 'BREAK'
  | 'AWAY'
  | 'DISCONNECTED'
  | 'RECONNECTING';

export type BreakType = 'SHORT' | 'TEA' | 'LUNCH' | 'EXTENDED' | 'NONE';

export interface BreakRecord {
  id: string;
  startTime: Date;
  endTime: Date | null;
  durationMs: number;
  type: BreakType;
}

export interface AttendanceSession {
  sessionStart: Date | null;
  connectedDurationMs: number;
  totalBreakMs: number;
  breaks: BreakRecord[];
  currentBreakStart: Date | null;
  status: AttendanceStatus;
  currentBreakDurationMs: number;
  currentBreakType: BreakType;
}

// ─────────────────────────────────────────────
// Daily report record — one saved session per day
// ─────────────────────────────────────────────

export interface DailyRecord {
  id: string;
  date: string;           // 'YYYY-MM-DD'
  employeeEmail: string;
  employeeName: string;
  sessionStart: string;   // ISO
  sessionEnd: string;     // ISO
  connectedDurationMs: number;
  totalBreakMs: number;
  breaks: BreakRecord[];
  status: AttendanceStatus;
}

// ─────────────────────────────────────────────
// Event log types
// ─────────────────────────────────────────────

export type EventType =
  | 'connected'
  | 'disconnected'
  | 'verified'
  | 'unverified'
  | 'break_start'
  | 'break_end'
  | 'session_start'
  | 'signal_change'
  | 'away'
  | 'reconnected'
  | 'initial';

export interface AttendanceEvent {
  id: string;
  timestamp: Date;
  message: string;
  type: EventType;
}
