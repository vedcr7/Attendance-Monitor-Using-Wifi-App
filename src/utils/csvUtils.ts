/**
 * csvUtils.ts — Build CSV strings from attendance records.
 * Uses no external library — plain string construction.
 * The output is shared via React Native's built-in Share API.
 */
import { Share } from 'react-native';
import type { DailyRecord } from '../types';
import { formatDuration } from '../hooks/useAttendanceState';

function esc(val: string): string {
  // Wrap in quotes and escape internal quotes per RFC 4180
  return `"${String(val).replace(/"/g, '""')}"`;
}

/**
 * Build a CSV string from an array of DailyRecord objects.
 */
export function buildCsv(records: DailyRecord[]): string {
  const headers = [
    'Date',
    'Employee',
    'Email',
    'Session Start',
    'Session End',
    'Connected Time',
    'Break Count',
    'Total Break Time',
    'Status',
  ];

  const rows = records.map(r => {
    const start = r.sessionStart ? new Date(r.sessionStart).toLocaleString() : '—';
    const end   = r.sessionEnd   ? new Date(r.sessionEnd).toLocaleString()   : 'Ongoing';
    return [
      esc(r.date),
      esc(r.employeeName),
      esc(r.employeeEmail),
      esc(start),
      esc(end),
      esc(formatDuration(r.connectedDurationMs)),
      esc(String(r.breaks.length)),
      esc(formatDuration(r.totalBreakMs)),
      esc(r.status),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Share a CSV string using the system share sheet.
 * On Android this lets the user pick Gmail, WhatsApp, Drive, etc.
 */
export async function shareCsv(
  records: DailyRecord[],
  title: string = 'Attendance Report',
): Promise<void> {
  if (records.length === 0) return;

  const csv = buildCsv(records);
  const date = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  await Share.share(
    {
      title,
      message: `Attendance Report — ${date}\n\n${csv}`,
    },
    {
      dialogTitle: 'Export Attendance CSV',
    },
  );
}

/**
 * Format a date as YYYY-MM-DD for use as a record key.
 */
export function toDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA'); // always YYYY-MM-DD regardless of locale
}
