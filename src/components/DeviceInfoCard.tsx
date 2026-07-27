/**
 * DeviceInfoCard — Displays device hardware and software information.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';
import type { DeviceInfo } from '../types';

interface Props {
  deviceInfo: DeviceInfo;
}

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function InfoRow({ label, value, mono = false }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.value, mono && styles.monoValue]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

export function DeviceInfoCard({ deviceInfo }: Props) {
  if (deviceInfo.isLoading) {
    return (
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            📱 Device Information
          </Text>
          <Text style={styles.loadingText}>Loading device info...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          📱 Device Information
        </Text>
        <Divider style={styles.divider} />

        <InfoRow label="Device Name" value={deviceInfo.deviceName} />
        <InfoRow
          label="Manufacturer"
          value={`${deviceInfo.brand} (${deviceInfo.manufacturer})`}
        />
        <InfoRow label="Model" value={deviceInfo.model} />
        <InfoRow
          label="Android Version"
          value={`Android ${deviceInfo.androidVersion} (API ${deviceInfo.apiLevel})`}
        />
        <InfoRow
          label="Device ID"
          value={deviceInfo.deviceId}
          mono
        />
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  value: {
    color: '#1A1A2E',
    fontSize: 13,
    flex: 1.5,
    textAlign: 'right',
    fontWeight: '600',
  },
  monoValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#5C6BC0',
  },
  loadingText: {
    color: '#9E9E9E',
    textAlign: 'center',
    marginVertical: 16,
  },
});
