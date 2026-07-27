/**
 * attendanceApiService.ts — Push/pull attendance records from the backend.
 * Works alongside AsyncStorage — local first, syncs to server when available.
 */
import apiClient from './apiClient';
import type { DailyRecord } from '../types';

// ── Push a completed session to the server ─────────────────────────────────
export async function pushAttendanceRecord(record: DailyRecord): Promise<void> {
  await apiClient.post('/api/attendance', {
    date:                  record.date,
    session_start:         record.sessionStart,
    session_end:           record.sessionEnd,
    connected_duration_ms: record.connectedDurationMs,
    total_break_ms:        record.totalBreakMs,
    break_count:           record.breaks.length,
    breaks:                record.breaks,
    status:                record.status,
  });
}

// ── Fetch records for the current user ─────────────────────────────────────
export async function fetchMyAttendance(params?: {
  from?: string;
  to?: string;
  date?: string;
}): Promise<DailyRecord[]> {
  const res = await apiClient.get('/api/attendance', { params });
  return res.data.records.map(mapRecord);
}

// ── Admin: fetch all records for today ────────────────────────────────────
export async function fetchTodayOverview(): Promise<{
  date: string;
  present: any[];
  absent: any[];
  summary: { total: number; present: number; absent: number };
}> {
  const res = await apiClient.get('/api/attendance/today');
  return res.data;
}

// ── Admin: fetch summary stats ─────────────────────────────────────────────
export async function fetchSummary(from?: string, to?: string) {
  const res = await apiClient.get('/api/attendance/summary', {
    params: { from, to },
  });
  return res.data;
}

// ── Map backend record → DailyRecord type ────────────────────────────────
function mapRecord(r: any): DailyRecord {
  return {
    id:                   r.id,
    date:                 r.date,
    employeeEmail:        r.employee_email || r.email || '',
    employeeName:         r.employee_name  || r.name  || '',
    sessionStart:         r.session_start  || '',
    sessionEnd:           r.session_end    || '',
    connectedDurationMs:  r.connected_duration_ms || 0,
    totalBreakMs:         r.total_break_ms        || 0,
    breaks:               r.breaks || [],
    status:               r.status || 'UNKNOWN',
  };
}
