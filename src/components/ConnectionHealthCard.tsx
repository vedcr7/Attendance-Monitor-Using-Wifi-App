/**
 * ConnectionHealthCard — RSSI, signal quality, band, IP, link speed.
 * Reuses the existing SignalMeter component.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';
import { SignalMeter } from './SignalMeter';
import { getBandLabel } from '../utils/signalUtils';
import type { WifiInfo } from '../types';

interface Props {
  wifiInfo: WifiInfo;
  lastUpdated: Date | null;
  isLoading: boolean;
}

export function ConnectionHealthCard({ wifiInfo, lastUpdated, isLoading }: Props) {
  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            📶 Connection Health
          </Text>
          <Text style={styles.updatedText}>
            {isLoading
              ? 'Updating...'
              : lastUpdated
              ? lastUpdated.toLocaleTimeString()
              : '—'}
          </Text>
        </View>
        <Divider style={styles.divider} />

        {/* Signal meter (reused from existing component) */}
        <SignalMeter rssi={wifiInfo.rssi} isConnected={wifiInfo.isConnected} />

        <Divider style={[styles.divider, { marginTop: 12 }]} />

        {/* Network details */}
        <Row label="Band" value={getBandLabel(wifiInfo.frequency)} />
        <Row
          label="Link Speed"
          value={wifiInfo.linkSpeed > 0 ? `${wifiInfo.linkSpeed} Mbps` : 'N/A'}
        />
        <Row label="IP Address" value={wifiInfo.ipAddress} mono />
        <Row
          label="Internet"
          value={wifiInfo.hasInternet ? '✅ Available' : '❌ Unavailable'}
        />
      </Card.Content>
    </Card>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, mono && styles.monoValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
  },
  updatedText: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#E8EAF6',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    color: '#1A1A2E',
    fontSize: 13,
    fontWeight: '600',
  },
  monoValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#5C6BC0',
  },
});
