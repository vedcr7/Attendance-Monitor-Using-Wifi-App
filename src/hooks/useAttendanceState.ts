/**
 * useAttendanceState.ts — The attendance state machine.
 *
 * STATE TRANSITIONS:
 *
 *   UNKNOWN ──▶ CONNECTED (first trusted connection)
 *   CONNECTED ──▶ BREAK (trusted router lost, within grace period)
 *   BREAK ──▶ CONNECTED (reconnected to trusted router)
 *   BREAK ──▶ AWAY (break exceeded MAX_AWAY_TIME)
 *   AWAY ──▶ RECONNECTING (came back to trusted router)
 *   RECONNECTING ──▶ CONNECTED (brief transition, auto-resolves)
 *   any ──▶ DISCONNECTED (WiFi off or not on trusted router for too long)
 *
 * BREAK CLASSIFICATION (based on away duration):
 *   < SHORT_GRACE_PERIOD    → SHORT (micro-break, barely counts)
 *   < TEA_BREAK_LIMIT       → TEA   (quick break)
 *   < LUNCH_BREAK_LIMIT     → LUNCH (lunch break)
 *   ≥ LUNCH_BREAK_LIMIT     → EXTENDED
 *
 * PERSISTENCE:
 * Session data is saved to AsyncStorage on every state change so it survives
 * app kills and restarts.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ATTENDANCE_CONFIG } from '../config/attendanceConfig';
import { saveSession, saveEvents, loadSession, loadEvents } from '../services/storageService';
import type {
  AttendanceEvent,
  AttendanceSession,
  AttendanceStatus,
  BreakRecord,
  BreakType,
  RouterVerificationState,
} from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

let breakIdCounter = 0;
function makeBreakId(): string {
  return `brk_${Date.now()}_${++breakIdCounter}`;
}

let evtIdCounter = 0;
function makeEvtId(): string {
  return `att_${Date.now()}_${++evtIdCounter}`;
}

function classifyBreak(durationMs: number): BreakType {
  if (durationMs < ATTENDANCE_CONFIG.SHORT_GRACE_PERIOD_MS) return 'SHORT';
  if (durationMs < ATTENDANCE_CONFIG.TEA_BREAK_LIMIT_MS) return 'TEA';
  if (durationMs < ATTENDANCE_CONFIG.LUNCH_BREAK_LIMIT_MS) return 'LUNCH';
  return 'EXTENDED';
}

const INITIAL_SESSION: AttendanceSession = {
  sessionStart: null,
  connectedDurationMs: 0,
  totalBreakMs: 0,
  breaks: [],
  currentBreakStart: null,
  status: 'UNKNOWN',
  currentBreakDurationMs: 0,
  currentBreakType: 'NONE',
};

// ── Hook ───────────────────────────────────────────────────────────────────

interface UseAttendanceStateReturn {
  session: AttendanceSession;
  attendanceEvents: AttendanceEvent[];
  resetSession: () => void;
}

export function useAttendanceState(
  verification: RouterVerificationState,
  monitorEnabled: boolean,
): UseAttendanceStateReturn {
  const [session, setSession] = useState<AttendanceSession>(INITIAL_SESSION);
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>([]);

  // Refs to avoid stale closures inside the timer
  const sessionRef = useRef<AttendanceSession>(INITIAL_SESSION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevVerifiedRef = useRef<boolean | null>(null);

  // ── Persist on every change ──────────────────────────────────────────────
  const updateSession = useCallback((updater: (s: AttendanceSession) => AttendanceSession) => {
    setSession(prev => {
      const next = updater(prev);
      sessionRef.current = next;
      saveSession(next); // fire-and-forget
      return next;
    });
  }, []);

  const addEvent = useCallback((message: string, type: AttendanceEvent['type']) => {
    const evt: AttendanceEvent = {
      id: makeEvtId(),
      timestamp: new Date(),
      message,
      type,
    };
    setAttendanceEvents(prev => {
      const next = [evt, ...prev].slice(0, ATTENDANCE_CONFIG.MAX_EVENT_LOG_ENTRIES);
      saveEvents(next); // fire-and-forget
      return next;
    });
  }, []);

  // ── Load persisted state on mount ────────────────────────────────────────
  useEffect(() => {
    async function hydrate() {
      const [savedSession, savedEvents] = await Promise.all([
        loadSession(),
        loadEvents(),
      ]);
      if (savedSession) {
        // Recalculate currentBreakDurationMs in case app was killed during a break
        const now = new Date();
        let restored = { ...savedSession };
        if (restored.currentBreakStart && restored.status === 'BREAK') {
          const breakMs = now.getTime() - new Date(restored.currentBreakStart).getTime();
          restored.currentBreakDurationMs = breakMs;
          restored.currentBreakType = classifyBreak(breakMs);
          if (breakMs >= ATTENDANCE_CONFIG.MAX_AWAY_TIME_MS) {
            restored.status = 'AWAY';
          }
        }
        sessionRef.current = restored;
        setSession(restored);
      }
      if (savedEvents?.length) {
        setAttendanceEvents(savedEvents);
      }
    }
    hydrate();
  }, []);

  // ── Tick timer — updates break duration every 5 seconds ─────────────────
  useEffect(() => {
    if (!monitorEnabled) return;

    timerRef.current = setInterval(() => {
      const s = sessionRef.current;
      if (s.currentBreakStart && (s.status === 'BREAK' || s.status === 'AWAY')) {
        const nowMs = Date.now();
        const breakMs = nowMs - new Date(s.currentBreakStart).getTime();
        const breakType = classifyBreak(breakMs);
        const newStatus: AttendanceStatus =
          breakMs >= ATTENDANCE_CONFIG.MAX_AWAY_TIME_MS ? 'AWAY' : 'BREAK';

        updateSession(prev => ({
          ...prev,
          status: newStatus,
          currentBreakDurationMs: breakMs,
          currentBreakType: breakType,
        }));
      } else if (s.status === 'CONNECTED' && s.sessionStart) {
        // Update connected duration
        const now = Date.now();
        const rawConnected = now - new Date(s.sessionStart).getTime();
        const connected = rawConnected - s.totalBreakMs;
        updateSession(prev => ({
          ...prev,
          connectedDurationMs: Math.max(0, connected),
        }));
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [monitorEnabled, updateSession]);

  // ── Main state machine — reacts to verification changes ─────────────────
  useEffect(() => {
    if (!monitorEnabled) return;

    const { isVerified } = verification;
    const prevVerified = prevVerifiedRef.current;

    // Skip on first render before we've gotten initial data
    if (prevVerified === null) {
      prevVerifiedRef.current = isVerified;
      return;
    }

    const now = new Date();
    const s = sessionRef.current;

    // ── CONNECTED → trusted router detected ──────────────────────────────
    if (isVerified && !prevVerified) {
      const routerName = verification.matchedRouter?.name ?? verification.currentBssid;

      if (s.status === 'UNKNOWN' || s.status === 'DISCONNECTED') {
        // Fresh session start
        addEvent(`Session started — connected to ${routerName}`, 'session_start');
        addEvent(`Office network verified: ${routerName}`, 'verified');
        updateSession(() => ({
          ...INITIAL_SESSION,
          sessionStart: now,
          status: 'CONNECTED',
        }));
      } else if (s.status === 'BREAK' || s.status === 'AWAY' || s.status === 'RECONNECTING') {
        // Returning from a break
        const breakStart = s.currentBreakStart ? new Date(s.currentBreakStart) : now;
        const breakMs = now.getTime() - breakStart.getTime();
        const breakType = classifyBreak(breakMs);

        const completedBreak: BreakRecord = {
          id: makeBreakId(),
          startTime: breakStart,
          endTime: now,
          durationMs: breakMs,
          type: breakType,
        };

        addEvent(`Reconnected to ${routerName} after ${formatDuration(breakMs)}`, 'reconnected');
        addEvent(`Break ended: ${breakType} (${formatDuration(breakMs)})`, 'break_end');

        updateSession(prev => ({
          ...prev,
          status: 'CONNECTED',
          currentBreakStart: null,
          currentBreakDurationMs: 0,
          currentBreakType: 'NONE',
          totalBreakMs: prev.totalBreakMs + breakMs,
          breaks: [...prev.breaks, completedBreak],
        }));
      }
    }

    // ── DISCONNECTED → lost trusted router ───────────────────────────────
    if (!isVerified && prevVerified) {
      if (s.status === 'CONNECTED') {
        addEvent(`Disconnected from ${verification.currentSsid || 'office network'}`, 'disconnected');
        addEvent('Break timer started', 'break_start');
        updateSession(prev => ({
          ...prev,
          status: 'BREAK',
          currentBreakStart: now,
          currentBreakDurationMs: 0,
          currentBreakType: 'NONE',
        }));
      }
    }

    prevVerifiedRef.current = isVerified;
  }, [verification, monitorEnabled, addEvent, updateSession]);

  // ── Reset session ────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    sessionRef.current = INITIAL_SESSION;
    prevVerifiedRef.current = null;
    setSession(INITIAL_SESSION);
    setAttendanceEvents([]);
    saveSession(INITIAL_SESSION);
    saveEvents([]);
  }, []);

  return { session, attendanceEvents, resetSession };
}

// ── Utility ────────────────────────────────────────────────────────────────

export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
