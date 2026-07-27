/**
 * attendanceConfig.ts — All timing and behaviour constants for the attendance engine.
 *
 * WHY a config file instead of hardcoding:
 * Different offices have different norms. A factory might allow 5-minute breaks,
 * a software team might allow 90-minute lunch. Centralising here means the entire
 * timing behaviour can be adjusted in one place with zero logic changes.
 *
 * All durations are in MILLISECONDS for direct use with Date arithmetic.
 */

export const ATTENDANCE_CONFIG = {
  // ── Polling ──────────────────────────────────────────────────────────────
  /** How often the WiFi monitor polls the native module (ms) */
  POLL_INTERVAL_MS: 3000,

  // ── Grace periods ─────────────────────────────────────────────────────────
  /** Brief disconnect that doesn't start a break — e.g. elevator, doorway (ms) */
  SHORT_GRACE_PERIOD_MS: 10 * 60 * 1000,      // 10 minutes

  /** A short away period — tea / coffee run (ms) */
  TEA_BREAK_LIMIT_MS: 20 * 60 * 1000,         // 20 minutes

  /** Standard lunch break allowance (ms) */
  LUNCH_BREAK_LIMIT_MS: 60 * 60 * 1000,       // 60 minutes

  /** Maximum total away time before session is considered ended (ms) */
  MAX_AWAY_TIME_MS: 120 * 60 * 1000,          // 120 minutes

  // ── Session ───────────────────────────────────────────────────────────────
  /** Minimum connected time to count as a valid attendance session (ms) */
  MIN_SESSION_DURATION_MS: 30 * 60 * 1000,    // 30 minutes

  // ── Signal thresholds ────────────────────────────────────────────────────
  /** RSSI below which a connection is considered "marginal" (dBm) */
  MARGINAL_RSSI_THRESHOLD: -75,

  // ── Display ───────────────────────────────────────────────────────────────
  /** Maximum event log entries to keep in memory */
  MAX_EVENT_LOG_ENTRIES: 50,

  /** How many event entries to show in the UI at once */
  VISIBLE_EVENT_LOG_ENTRIES: 8,
} as const;

export type AttendanceConfigKey = keyof typeof ATTENDANCE_CONFIG;
