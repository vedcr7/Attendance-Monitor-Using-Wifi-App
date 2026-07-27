/**
 * EventLogCard — Timestamped history of WiFi and attendance events.
 * Merges monitor events (connect/disconnect/signal) with attendance events
 * (break start/end, session start, verified) into a single chronological log.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';
import { ATTENDANCE_CONFIG } from '../config/attendanceConfig';
import type { AttendanceEvent, EventType } from '../types';

interface Props {
  monitorEvents: AttendanceEvent[];
  attendanceEvents: AttendanceEvent[];
}

const EVENT_COLORS: Record<EventType, string> = {
  connected:     '#00C853',
  disconnected:  '#D50000',
  verified:      '#2E7D32',
  unverified:    '#B71C1C',
  break_start:   '#FF6D00',
  break_end:     '#00ACC1',
  session_start: '#1565C0',
  signal_change: '#F9A825',
  away:          '#AD1457',
  reconnected:   '#00897B',
  initial:       '#9E9E9E',
};

export function EventLogCard({ monitorEvents, attendanceEvents }: Props) {
  // Merge and sort by timestamp descending
  const merged = useMemo(() => {
    const all = [...monitorEvents, ...attendanceEvents];
    all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return all.slice(0, ATTENDANCE_CONFIG.VISIBLE_EVENT_LOG_ENTRIES);
  }, [monitorEvents, attendanceEvents]);

  if (merged.length === 0) return null;

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          🕐 Event Log
        </Text>
        <Divider style={styles.divider} />
        <ScrollView scrollEnabled={false}>
          {merged.map(event => (
            <View key={event.id} style={styles.entry}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: EVENT_COLORS[event.type] ?? '#9E9E9E' },
                ]}
              />
              <View style={styles.entryContent}>
                <Text style={styles.entryMessage}>{event.message}</Text>
                <Text style={styles.entryTime}>
                  {event.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
  },
  cardTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#E8EAF6',
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 10,
    flexShrink: 0,
  },
  entryContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryMessage: {
    color: '#1A1A2E',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  entryTime: {
    color: '#9E9E9E',
    fontSize: 10,
    flexShrink: 0,
    marginTop: 1,
  },
});
