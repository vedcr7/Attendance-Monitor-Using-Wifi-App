/**
 * RouterVerificationCard — VERIFIED / NOT VERIFIED indicator.
 * This is the primary trust signal — tells the user whether they're on an office router.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';
import { DEV_MODE } from '../config/trustedRouters';
import type { RouterVerificationState } from '../types';

interface Props {
  verification: RouterVerificationState;
}

export function RouterVerificationCard({ verification }: Props) {
  const { isVerified, matchedRouter, currentBssid, currentSsid } = verification;

  const color = isVerified ? '#00C853' : '#D50000';
  const bg    = isVerified ? '#E8F5E9' : '#FFEBEE';
  const icon  = isVerified ? '✅' : '❌';
  const label = isVerified ? 'VERIFIED' : 'NOT VERIFIED';

  return (
    <Card style={[styles.card, { borderLeftColor: color }]} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          🏢 Office Network
        </Text>
        {DEV_MODE && (
          <Chip
            compact
            style={styles.devChip}
            textStyle={styles.devChipText}
          >
            DEV MODE — matches any WiFi
          </Chip>
        )}
        <Divider style={styles.divider} />

        {/* Verification status badge */}
        <View style={[styles.verifiedBadge, { backgroundColor: bg }]}>
          <Text style={styles.verifiedIcon}>{icon}</Text>
          <Text style={[styles.verifiedLabel, { color }]}>{label}</Text>
        </View>

        {/* Router details */}
        <View style={styles.detailsContainer}>
          <DetailRow
            label="Trusted Router"
            value={matchedRouter?.name ?? '—'}
            highlight={isVerified}
          />
          <DetailRow
            label="Connected SSID"
            value={currentSsid && currentSsid !== 'Unknown' ? currentSsid : '—'}
          />
          <DetailRow
            label="Connected BSSID"
            value={currentBssid && currentBssid !== 'N/A' ? currentBssid : '—'}
            mono
          />
          {matchedRouter?.location && (
            <DetailRow label="Location" value={matchedRouter.location} />
          )}
        </View>

        {/* Not verified explanation */}
        {!isVerified && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {!currentBssid || currentBssid === 'N/A'
                ? '📵 Not connected to any WiFi network.'
                : '⚠️ Current network is not in the trusted office router list. Attendance will not be recorded.'}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
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

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 5,
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 12,
    gap: 8,
  },
  verifiedIcon: {
    fontSize: 18,
  },
  verifiedLabel: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  rowLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  rowValue: {
    color: '#1A1A2E',
    fontSize: 13,
    fontWeight: '600',
    flex: 1.4,
    textAlign: 'right',
  },
  monoValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#5C6BC0',
  },
  highlightValue: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  warningText: {
    color: '#E65100',
    fontSize: 12,
    lineHeight: 18,
  },
  devChip: {
    backgroundColor: '#FFF9C4',
    alignSelf: 'flex-start',
    marginBottom: 6,
    height: 22,
  },
  devChipText: {
    color: '#F57F17',
    fontSize: 10,
    fontWeight: '700',
  },
});
