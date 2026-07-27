/**
 * AttendanceReportScreen — Daily attendance records with CSV export.
 *
 * Data source strategy — local-first with API merge:
 *   1. Load local records from AsyncStorage immediately (fast, offline-safe)
 *   2. Fetch from backend API in parallel
 *   3. Merge both — API records take priority for same employee+date
 *
 * Admins see all employees. Employees see only their own records.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';
import { formatDuration } from '../hooks/useAttendanceState';
import { loadDailyRecords } from '../services/storageService';
import { fetchMyAttendance } from '../services/attendanceApiService';
import { shareCsv } from '../utils/csvUtils';
import type { DailyRecord, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AttendanceReportScreen'>;

const STATUS_COLOR: Record<string, string> = {
  CONNECTED:    '#00C853',
  BREAK:        '#FF6D00',
  AWAY:         '#D50000',
  DISCONNECTED: '#9E9E9E',
  UNKNOWN:      '#9E9E9E',
  RECONNECTING: '#1565C0',
};

export function AttendanceReportScreen({ navigation, route }: Props) {
  const { user } = route.params;
  const isAdmin = user.role === 'ADMIN';

  const [records, setRecords]         = useState<DailyRecord[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [apiError, setApiError]       = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(
    isAdmin ? null : user.email,
  );
  const [isExporting, setIsExporting] = useState(false);

  // ── Load: local first, then merge with API ─────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    // 1. Local records immediately
    const local = await loadDailyRecords();

    // 2. API records in parallel
    let apiRecords: DailyRecord[] = [];
    try {
      apiRecords = await fetchMyAttendance();
    } catch (e: any) {
      setApiError('Backend offline — showing local data only');
    }

    // 3. Merge — API wins for same employee+date key
    const merged = new Map<string, DailyRecord>();
    local.forEach(r => merged.set(`${r.employeeEmail}_${r.date}`, r));
    apiRecords.forEach(r => merged.set(`${r.employeeEmail}_${r.date}`, r)); // API overwrites

    const sorted = Array.from(merged.values())
      .sort((a, b) => b.date.localeCompare(a.date));

    setRecords(sorted);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived state ──────────────────────────────────────────────────────
  const employeeEmails = useMemo(() => {
    const set = new Set(records.map(r => r.employeeEmail));
    return Array.from(set);
  }, [records]);

  const filtered = useMemo(() => {
    if (!selectedEmail) return records;
    return records.filter(r => r.employeeEmail === selectedEmail);
  }, [records, selectedEmail]);

  const totals = useMemo(() => ({
    totalConnected:  filtered.reduce((s, r) => s + r.connectedDurationMs, 0),
    totalBreaks:     filtered.reduce((s, r) => s + r.totalBreakMs, 0),
    totalBreakCount: filtered.reduce((s, r) => s + r.breaks.length, 0),
  }), [filtered]);

  // ── Export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (filtered.length === 0) return;
    setIsExporting(true);
    try {
      await shareCsv(
        filtered,
        selectedEmail
          ? `Attendance — ${selectedEmail}`
          : 'Attendance — All Employees',
      );
    } finally {
      setIsExporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Report</Text>
        <TouchableOpacity
          onPress={handleExport}
          style={[styles.exportBtn, (filtered.length === 0 || isExporting) && { opacity: 0.4 }]}
          disabled={filtered.length === 0 || isExporting}
        >
          <Text style={styles.exportText}>{isExporting ? '...' : '📤 Export'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => `${item.employeeEmail}_${item.date}`}
        contentContainerStyle={styles.list}
        onRefresh={load}
        refreshing={isLoading}
        ListHeaderComponent={
          <>
            {/* API error banner */}
            {apiError && (
              <View style={styles.warnBanner}>
                <Text style={styles.warnText}>⚠️ {apiError}</Text>
              </View>
            )}

            {/* Employee filter (admin only) */}
            {isAdmin && employeeEmails.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>FILTER BY EMPLOYEE</Text>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    onPress={() => setSelectedEmail(null)}
                    style={[styles.filterChip, !selectedEmail && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, !selectedEmail && styles.filterChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {employeeEmails.map(email => (
                    <TouchableOpacity
                      key={email}
                      onPress={() => setSelectedEmail(email)}
                      style={[styles.filterChip, selectedEmail === email && styles.filterChipActive]}
                    >
                      <Text
                        style={[styles.filterChipText, selectedEmail === email && styles.filterChipTextActive]}
                        numberOfLines={1}
                      >
                        {email.split('@')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Summary */}
            {filtered.length > 0 && (
              <Card style={styles.summaryCard} elevation={2}>
                <Card.Content>
                  <Text style={styles.summaryTitle}>
                    📊 {filtered.length} day{filtered.length !== 1 ? 's' : ''}
                    {selectedEmail ? ` · ${selectedEmail.split('@')[0]}` : ''}
                  </Text>
                  <Divider style={styles.divider} />
                  <View style={styles.metricsRow}>
                    <Metric label="Connected"  value={formatDuration(totals.totalConnected)} />
                    <Metric label="Breaks"     value={String(totals.totalBreakCount)} />
                    <Metric label="Break Time" value={formatDuration(totals.totalBreaks)} />
                  </View>
                </Card.Content>
              </Card>
            )}

            <Text style={styles.sectionLabel}>
              RECORDS {filtered.length > 0 ? `(${filtered.length})` : ''}
            </Text>
          </>
        }
        renderItem={({ item }) => <RecordCard record={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <Card style={styles.emptyCard} elevation={1}>
              <Card.Content>
                <Text style={styles.emptyTitle}>No records yet</Text>
                <Text style={styles.emptyText}>
                  Records appear here automatically when a session ends on a
                  trusted office network. Pull down to refresh.
                </Text>
              </Card.Content>
            </Card>
          ) : null
        }
      />
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RecordCard({ record }: { record: DailyRecord }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLOR[record.status] ?? '#9E9E9E';

  return (
    <Card style={styles.recordCard} elevation={1}>
      <TouchableOpacity onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <Card.Content>
          <View style={styles.recordHeader}>
            <View>
              <Text style={styles.recordDate}>{record.date}</Text>
              <Text style={styles.recordEmployee}>{record.employeeName}</Text>
            </View>
            <Chip
              compact
              style={{ backgroundColor: color + '20' }}
              textStyle={{ color, fontSize: 10, fontWeight: '700' }}
            >
              {record.status}
            </Chip>
          </View>

          <View style={styles.recordTimes}>
            <TimeCell label="Start"
              value={record.sessionStart
                ? new Date(record.sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '—'} />
            <TimeCell label="End"
              value={record.sessionEnd
                ? new Date(record.sessionEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Ongoing'} />
            <TimeCell label="Connected" value={formatDuration(record.connectedDurationMs)} />
            <TimeCell label="Breaks"    value={`${record.breaks.length} (${formatDuration(record.totalBreakMs)})`} />
          </View>

          {record.breaks.length > 0 && (
            <Text style={styles.expandHint}>
              {expanded
                ? '▲ Hide breaks'
                : `▼ ${record.breaks.length} break${record.breaks.length > 1 ? 's' : ''}`}
            </Text>
          )}
        </Card.Content>
      </TouchableOpacity>

      {expanded && record.breaks.map((b, i) => (
        <View key={b.id ?? i} style={styles.breakRow}>
          <Text style={styles.breakIndex}>Break {i + 1}</Text>
          <Text style={styles.breakType}>{b.type}</Text>
          <Text style={styles.breakDuration}>{formatDuration(b.durationMs)}</Text>
        </View>
      ))}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function TimeCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.timeCell}>
      <Text style={styles.timeCellValue}>{value}</Text>
      <Text style={styles.timeCellLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F2FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#3F51B5', paddingHorizontal: 16, paddingVertical: 14, paddingTop: 20,
  },
  backBtn: { padding: 4 },
  backText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  exportBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  exportText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },
  warnBanner: {
    backgroundColor: '#FFF3E0', borderRadius: 8, padding: 10, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: '#FF6D00',
  },
  warnText: { color: '#E65100', fontSize: 12 },
  filterSection: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#9E9E9E',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: '#3F51B5', borderColor: '#3F51B5' },
  filterChipText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  summaryCard: { borderRadius: 12, backgroundColor: '#FFFFFF', marginBottom: 16 },
  summaryTitle: { fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  divider: { marginVertical: 10, backgroundColor: '#E8EAF6' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metric: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  metricLabel: { fontSize: 10, color: '#9E9E9E', marginTop: 2 },
  recordCard: { borderRadius: 10, backgroundColor: '#FFFFFF', marginBottom: 10 },
  recordHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  recordDate:     { fontWeight: '800', color: '#1A1A2E', fontSize: 15 },
  recordEmployee: { color: '#5C6BC0', fontSize: 12, marginTop: 2 },
  recordTimes:    { flexDirection: 'row', justifyContent: 'space-between' },
  timeCell:       { alignItems: 'center', flex: 1 },
  timeCellValue:  { fontWeight: '700', color: '#1A1A2E', fontSize: 12 },
  timeCellLabel:  { color: '#9E9E9E', fontSize: 10, marginTop: 1 },
  expandHint: { color: '#3F51B5', fontSize: 11, marginTop: 10, textAlign: 'center' },
  breakRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: '#F5F5F5', borderTopWidth: 1, borderTopColor: '#EEEEEE',
  },
  breakIndex:    { color: '#6B7280', fontSize: 12 },
  breakType:     { color: '#FF6D00', fontSize: 12, fontWeight: '600' },
  breakDuration: { color: '#1A1A2E', fontSize: 12, fontWeight: '700' },
  emptyCard:     { borderRadius: 12, backgroundColor: '#FFFFFF' },
  emptyTitle:    { fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  emptyText:     { color: '#6B7280', fontSize: 13, lineHeight: 20 },
});
