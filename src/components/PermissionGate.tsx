/**
 * PermissionGate — Shown when required permissions are not yet granted.
 * Explains WHY each permission is needed before asking the user.
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import type { PermissionState } from '../types';

interface Props {
  permissions: PermissionState;
  onRequest: () => void;
  onOpenSettings: () => void;
}

export function PermissionGate({ permissions, onRequest, onOpenSettings }: Props) {
  const isBlocked =
    permissions.fineLocation === 'blocked' ||
    permissions.nearbyWifi === 'blocked';

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text variant="headlineSmall" style={styles.title}>
        Permissions Required
      </Text>
      <Text style={styles.subtitle}>
        To monitor WiFi networks, this app needs the following permissions:
      </Text>

      <Card style={styles.permCard} elevation={1}>
        <Card.Content>
          <View style={styles.permRow}>
            <Text style={styles.permIcon}>📍</Text>
            <View style={styles.permText}>
              <Text style={styles.permName}>Location (Fine)</Text>
              <Text style={styles.permReason}>
                Required by Android to read the WiFi network name (SSID).
                Without this, Android hides the network name for privacy.
              </Text>
              <Text
                style={[
                  styles.permStatus,
                  {
                    color:
                      permissions.fineLocation === 'granted'
                        ? '#00C853'
                        : '#D50000',
                  },
                ]}
              >
                {permissions.fineLocation === 'granted' ? '✅ Granted' : '❌ Not granted'}
              </Text>
            </View>
          </View>

          {Platform.Version >= 31 && (
            <>
              <View style={styles.permDivider} />
              <View style={styles.permRow}>
                <Text style={styles.permIcon}>📶</Text>
                <View style={styles.permText}>
                  <Text style={styles.permName}>Nearby WiFi Devices</Text>
                  <Text style={styles.permReason}>
                    Required on Android 12+ to scan for and monitor nearby WiFi
                    networks.
                  </Text>
                  <Text
                    style={[
                      styles.permStatus,
                      {
                        color:
                          permissions.nearbyWifi === 'granted'
                            ? '#00C853'
                            : permissions.nearbyWifi === 'unavailable'
                            ? '#9E9E9E'
                            : '#D50000',
                      },
                    ]}
                  >
                    {permissions.nearbyWifi === 'granted'
                      ? '✅ Granted'
                      : permissions.nearbyWifi === 'unavailable'
                      ? '— Not applicable'
                      : '❌ Not granted'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {isBlocked ? (
        <>
          <Text style={styles.blockedNote}>
            Permissions were permanently denied. Please enable them in your device
            Settings → Apps → WiFi Track → Permissions.
          </Text>
          <Button
            mode="contained"
            onPress={onOpenSettings}
            style={styles.button}
            buttonColor="#3F51B5"
          >
            Open Settings
          </Button>
        </>
      ) : (
        <Button
          mode="contained"
          onPress={onRequest}
          style={styles.button}
          buttonColor="#3F51B5"
          icon="shield-check"
        >
          Grant Permissions
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  icon: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  permCard: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  permIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  permText: {
    flex: 1,
  },
  permName: {
    fontWeight: '700',
    color: '#1A1A2E',
    fontSize: 14,
    marginBottom: 2,
  },
  permReason: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  permStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  permDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  blockedNote: {
    color: '#D50000',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 8,
    width: '100%',
  },
});
