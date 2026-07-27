/**
 * storageService.ts — AsyncStorage wrapper for all app persistence.
 *
 * Key namespacing:
 *   wta_session          — current live session
 *   wta_events           — current live events
 *   wta_last_bssid       — last seen BSSID
 *   wta_trusted_routers  — user-managed trusted router list
 *   wta_employees        — employee profile list
 *   wta_daily_records    — saved daily attendance records (all employees)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AttendanceEvent,
  AttendanceSession,
  DailyRecord,
  EmployeeProfile,
} from '../types';
import type { TrustedRouter } from '../config/trustedRouters';

const KEYS = {
  SESSION: 'wta_session',
  EVENTS: 'wta_events',
  LAST_BSSID: 'wta_last_bssid',
  TRUSTED_ROUTERS: 'wta_trusted_routers',
  EMPLOYEES: 'wta_employees',
  DAILY_RECORDS: 'wta_daily_records',
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Live Session ───────────────────────────────────────────────────────────

export async function saveSession(session: AttendanceSession): Promise<void> {
  await setJSON(KEYS.SESSION, session);
}

export async function loadSession(): Promise<AttendanceSession | null> {
  const parsed = await getJSON<any>(KEYS.SESSION);
  if (!parsed) return null;
  return {
    ...parsed,
    sessionStart: parsed.sessionStart ? new Date(parsed.sessionStart) : null,
    currentBreakStart: parsed.currentBreakStart
      ? new Date(parsed.currentBreakStart)
      : null,
    breaks: (parsed.breaks || []).map((b: any) => ({
      ...b,
      startTime: new Date(b.startTime),
      endTime: b.endTime ? new Date(b.endTime) : null,
    })),
  };
}

export async function clearSession(): Promise<void> {
  try { await AsyncStorage.removeItem(KEYS.SESSION); } catch {}
}

// ── Live Events ────────────────────────────────────────────────────────────

export async function saveEvents(events: AttendanceEvent[]): Promise<void> {
  await setJSON(KEYS.EVENTS, events.slice(0, 50));
}

export async function loadEvents(): Promise<AttendanceEvent[]> {
  const parsed = await getJSON<any[]>(KEYS.EVENTS);
  if (!parsed) return [];
  return parsed.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }));
}

export async function clearEvents(): Promise<void> {
  try { await AsyncStorage.removeItem(KEYS.EVENTS); } catch {}
}

// ── Last BSSID ─────────────────────────────────────────────────────────────

export async function saveLastBssid(bssid: string): Promise<void> {
  await setJSON(KEYS.LAST_BSSID, bssid);
}

export async function loadLastBssid(): Promise<string | null> {
  return getJSON<string>(KEYS.LAST_BSSID);
}

// ── Trusted Routers (user-managed, overrides static config) ───────────────

export async function loadTrustedRouters(): Promise<TrustedRouter[] | null> {
  return getJSON<TrustedRouter[]>(KEYS.TRUSTED_ROUTERS);
}

export async function saveTrustedRouters(routers: TrustedRouter[]): Promise<void> {
  await setJSON(KEYS.TRUSTED_ROUTERS, routers);
}

export async function addTrustedRouter(router: TrustedRouter): Promise<TrustedRouter[]> {
  const existing = (await loadTrustedRouters()) ?? [];
  // Prevent duplicate BSSIDs
  const filtered = existing.filter(
    r => r.bssid.toUpperCase() !== router.bssid.toUpperCase(),
  );
  const updated = [...filtered, router];
  await saveTrustedRouters(updated);
  return updated;
}

export async function removeTrustedRouter(id: number): Promise<TrustedRouter[]> {
  const existing = (await loadTrustedRouters()) ?? [];
  const updated = existing.filter(r => r.id !== id);
  await saveTrustedRouters(updated);
  return updated;
}

export async function updateTrustedRouter(
  id: number,
  patch: Partial<TrustedRouter>,
): Promise<TrustedRouter[]> {
  const existing = (await loadTrustedRouters()) ?? [];
  const updated = existing.map(r => (r.id === id ? { ...r, ...patch } : r));
  await saveTrustedRouters(updated);
  return updated;
}

// ── Employee Profiles ──────────────────────────────────────────────────────

export async function loadEmployees(): Promise<EmployeeProfile[]> {
  return (await getJSON<EmployeeProfile[]>(KEYS.EMPLOYEES)) ?? [];
}

export async function saveEmployees(employees: EmployeeProfile[]): Promise<void> {
  await setJSON(KEYS.EMPLOYEES, employees);
}

export async function addEmployee(employee: EmployeeProfile): Promise<EmployeeProfile[]> {
  const existing = await loadEmployees();
  const filtered = existing.filter(e => e.email !== employee.email);
  const updated = [...filtered, employee];
  await saveEmployees(updated);
  return updated;
}

export async function removeEmployee(id: string): Promise<EmployeeProfile[]> {
  const existing = await loadEmployees();
  const updated = existing.filter(e => e.id !== id);
  await saveEmployees(updated);
  return updated;
}

// ── Daily Records ──────────────────────────────────────────────────────────

export async function loadDailyRecords(): Promise<DailyRecord[]> {
  const parsed = await getJSON<any[]>(KEYS.DAILY_RECORDS);
  if (!parsed) return [];
  return parsed.map((r: any) => ({
    ...r,
    breaks: (r.breaks || []).map((b: any) => ({
      ...b,
      startTime: new Date(b.startTime),
      endTime: b.endTime ? new Date(b.endTime) : null,
    })),
  }));
}

export async function saveDailyRecord(record: DailyRecord): Promise<void> {
  const existing = await loadDailyRecords();
  // Replace any record for same employee+date, else append
  const filtered = existing.filter(
    r => !(r.employeeEmail === record.employeeEmail && r.date === record.date),
  );
  await setJSON(KEYS.DAILY_RECORDS, [...filtered, record]);
}

export async function loadDailyRecordsForEmployee(
  email: string,
): Promise<DailyRecord[]> {
  const all = await loadDailyRecords();
  return all
    .filter(r => r.employeeEmail === email)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function clearDailyRecords(): Promise<void> {
  try { await AsyncStorage.removeItem(KEYS.DAILY_RECORDS); } catch {}
}

// ── Full clear ─────────────────────────────────────────────────────────────

export async function clearAllAttendanceData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {}
}
