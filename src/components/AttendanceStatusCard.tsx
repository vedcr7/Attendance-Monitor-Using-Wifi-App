/**
 * AttendanceStatusCard — The most prominent card. Shows PRESENT/BREAK/AWAY.
 * Uses strong colour coding so status is readable at a glance.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { formatDuration } from '../hooks/useAttendanceState';
import type { AttendanceSession } from '../types';

interface Props {
  session: AttendanceSession;
}

const STATUS_CONFIG = {
  CONNECTED: { label: 'PRESENT', color: '#00C853', bg: '#E8F5E9', icon: '✅' },
  BREAK:     { label: 'ON BREAK', color: '#FF6D00', bg: '#FFF3E0', icon: '☕' },
  AWAY:      { label: 'AWAY',     color: '#D50000', bg: '#FFEBEE', icon: '⚠️' },
  DISCONNECTED: { label: 'DISCONNECTED', color: '#9E9E9E', bg: '#F5F5F5', icon: '📵' },
  RECONNECTING: { label: 'RECONNECTING', color: '#1565C0', bg: '#E3F2FD', icon: '🔄' },
  UNKNOWN:   { label: 'UNKNOWN',  color: '#9E9E9E', bg: '#F5F5F5', icon: '❓' },
} as const;

export function AttendanceStatusCard({ session }: Props) {
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.UNKNOWN;

  const connectedDisplay = session.connectedDurationMs > 0
    ? formatDuration(session.connectedDurationMs)
    : '—';

  const breakDisplay = session.currentBreakDurationMs > 0
    ? formatDuration(session.currentBreakDurationMs)
    : null;

  return (
    <Card style={[styles.card, { borderLeftColor: cfg.color }]} elevation={3}>
      <Card.Content>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={styles.statusIcon}>{cfg.icon}</Text>
          <Text style={[styles.statusLabel, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>

        {/* Break type label */}
        {(session.status === 'BREAK' || session.status === 'AWAY') &&
          session.currentBreakType !== 'NONE' && (
          <Text style={[styles.breakTypeLabel, { color: cfg.color }]}>
            {session.currentBreakType === 'SHORT' ? 'Short break'
              : session.currentBreakType === 'TEA' ? 'Tea / Coffee break'
              : session.currentBreakType === 'LUNCH' ? 'Lunch break'
              : 'Extended absence'}
          </Text>
        )}

        {/* Duration row */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{connectedDisplay}</Text>
            <Text style={styles.metricLabel}>Connected</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {session.breaks.length}
            </Text>
            <Text style={styles.metricLabel}>Breaks</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {session.totalBreakMs > 0 ? formatDuration(session.totalBreakMs) : '—'}
            </Text>
            <Text style={styles.metricLabel}>Break Time</Text>
          </View>
        </View>

        {/* Active break timer */}
        {breakDisplay && (
          <View style={[styles.breakTimer, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.breakTimerText, { color: cfg.color }]}>
              ⏱ Away for {breakDisplay}
            </Text>
          </View>
        )}

        {/* Session start */}
        {session.sessionStart && (
          <Text style={styles.sessionStart}>
            Session started at {new Date(session.sessionStart).toLocaleTimeString()}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 8,
    gap: 8,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  breakTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 4,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  metricLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F0F0F0',
  },
  breakTimer: {
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  breakTimerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sessionStart: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'right',
    marginTop: 8,
  },
});
