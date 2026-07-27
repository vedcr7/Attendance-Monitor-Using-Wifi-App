/**
 * WifiInfoCard — Displays all collected WiFi data plus the live signal meter.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';
import type { WifiInfo } from '../types';
import { getBandLabel } from '../utils/signalUtils';
import { SignalMeter } from './SignalMeter';

interface Props {
  wifiInfo: WifiInfo;
  lastUpdated: Date | null;
  isLoading: boolean;
  changeLog: Array<{ timestamp: Date; message: string; type: string }>;
}

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}

function InfoRow({ label, value, mono = false, highlight = false }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          mono && styles.monoValue,
          highlight && styles.highlightValue,
        ]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

export function WifiInfoCard({
  wifiInfo,
  lastUpdated,
  isLoading,
  changeLog,
}: Props) {
  const connectionColor = wifiInfo.isConnected ? '#00C853' : '#D50000';
  const connectionLabel = wifiInfo.isConnected ? 'Connected' : 'Disconnected';

  return (
    <View>
      {/* ── Signal Visualization Card ── */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <View style={styles.cardHeaderRow}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              📶 Live Signal
            </Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: connectionColor + '20' },
              ]}
              textStyle={{ color: connectionColor, fontSize: 11, fontWeight: '700' }}
              compact
            >
              {connectionLabel}
            </Chip>
          </View>
          <Divider style={styles.divider} />
          <SignalMeter rssi={wifiInfo.rssi} isConnected={wifiInfo.isConnected} />

          {/* Last updated timestamp */}
          <Text style={styles.timestamp}>
            {isLoading
              ? 'Updating...'
              : lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
              : 'Not yet updated'}
          </Text>
        </Card.Content>
      </Card>

      {/* ── WiFi Details Card ── */}
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            🔌 WiFi Details
          </Text>
          <Divider style={styles.divider} />

          <InfoRow
            label="SSID"
            value={wifiInfo.ssid || 'N/A'}
            highlight
          />
          <InfoRow label="BSSID" value={wifiInfo.bssid} mono />
          <InfoRow label="IP Address" value={wifiInfo.ipAddress} mono />
          <InfoRow label="Band" value={getBandLabel(wifiInfo.frequency)} />
          <InfoRow
            label="Link Speed"
            value={wifiInfo.linkSpeed > 0 ? `${wifiInfo.linkSpeed} Mbps` : 'N/A'}
          />
          <InfoRow
            label="Network Type"
            value={wifiInfo.networkType}
          />
          <InfoRow
            label="Internet"
            value={wifiInfo.hasInternet ? '✅ Available' : '❌ Not Available'}
          />
          <InfoRow
            label="Network ID"
            value={wifiInfo.networkId}
            mono
          />
        </Card.Content>
      </Card>

      {/* ── Change Log Card ── */}
      {changeLog.length > 0 && (
        <Card style={styles.card} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              🕐 Event Log
            </Text>
            <Divider style={styles.divider} />
            {changeLog.slice(0, 5).map((entry, index) => (
              <View key={index} style={styles.logEntry}>
                <View
                  style={[
                    styles.logDot,
                    {
                      backgroundColor:
                        entry.type === 'connected'
                          ? '#00C853'
                          : entry.type === 'disconnected'
                          ? '#D50000'
                          : entry.type === 'signal'
                          ? '#FF6D00'
                          : '#5C6BC0',
                    },
                  ]}
                />
                <View style={styles.logContent}>
                  <Text style={styles.logMessage}>{entry.message}</Text>
                  <Text style={styles.logTime}>
                    {entry.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statusChip: {
    height: 26,
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
  highlightValue: {
    color: '#3F51B5',
    fontSize: 14,
  },
  timestamp: {
    color: '#9E9E9E',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 10,
  },
  logContent: {
    flex: 1,
  },
  logMessage: {
    color: '#1A1A2E',
    fontSize: 12,
    fontWeight: '500',
  },
  logTime: {
    color: '#9E9E9E',
    fontSize: 10,
    marginTop: 1,
  },
});
