import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';
import { AttendanceStatusCard } from '../components/AttendanceStatusCard';
import { ConnectionHealthCard } from '../components/ConnectionHealthCard';
import { DeviceInfoCard } from '../components/DeviceInfoCard';
import { EventLogCard } from '../components/EventLogCard';
import { PermissionGate } from '../components/PermissionGate';
import { RouterVerificationCard } from '../components/RouterVerificationCard';
import { useAttendanceState } from '../hooks/useAttendanceState';
import { useDeviceInfo } from '../hooks/useDeviceInfo';
import { usePermissions } from '../hooks/usePermissions';
import { useRouterVerification } from '../hooks/useRouterVerification';
import { useWifiMonitor } from '../hooks/useWifiMonitor';
import { saveDailyRecord } from '../services/storageService';
import { pushAttendanceRecord } from '../services/attendanceApiService';
import { logout } from '../services/authService';
import { toDateKey } from '../utils/csvUtils';
import type { DailyRecord, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation, route }: Props) {
  const { user } = route.params;
  const isAdmin = user.role === 'ADMIN';

  const { permissions, requestPermissions, openAppSettings } = usePermissions();
  const deviceInfo = useDeviceInfo();

  const { wifiInfo, isLoading, lastUpdated, events: monitorEvents, refresh } =
    useWifiMonitor(permissions.allGranted);

  const verification = useRouterVerification(wifiInfo);

  const { session, attendanceEvents, resetSession } = useAttendanceState(
    verification,
    permissions.allGranted,
  );

  const [deviceInfoExpanded, setDeviceInfoExpanded] = useState(false);

  // ── Auto-save daily record when session ends (status → DISCONNECTED/AWAY) ──
  const prevStatusRef = useRef(session.status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = session.status;
    prevStatusRef.current = curr;

    // Save when we transition away from an active session
    if (
      (prev === 'CONNECTED' || prev === 'BREAK') &&
      (curr === 'AWAY' || curr === 'DISCONNECTED') &&
      session.sessionStart
    ) {
      const record: DailyRecord = {
        id: `${user.email}_${Date.now()}`,
        date: toDateKey(new Date(session.sessionStart)),
        employeeEmail: user.email,
        employeeName: user.name,
        sessionStart: new Date(session.sessionStart).toISOString(),
        sessionEnd: new Date().toISOString(),
        connectedDurationMs: session.connectedDurationMs,
        totalBreakMs: session.totalBreakMs,
        breaks: session.breaks,
        status: curr,
      };
      saveDailyRecord(record); // save locally
      pushAttendanceRecord(record).catch(() => {}); // sync to backend (fire-and-forget)
    }
  }, [session.status, session, user]);

  const handleLogout = useCallback(async () => {
    await logout(); // clear JWT from EncryptedStorage
    navigation.replace('Login');
  }, [navigation]);

  if (!permissions.isChecking && !permissions.allGranted) {
    return (
      <PermissionGate
        permissions={permissions}
        onRequest={requestPermissions}
        onOpenSettings={openAppSettings}
      />
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={['#3F51B5']} />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back 👋</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <View style={styles.headerRight}>
          <Chip
            style={[styles.roleChip, { backgroundColor: isAdmin ? '#E8EAF6' : '#E8F5E9' }]}
            textStyle={{ color: isAdmin ? '#3F51B5' : '#2E7D32', fontWeight: '700', fontSize: 11 }}
            compact
          >
            {user.role}
          </Chip>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick action buttons ── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.qaBtn}
          onPress={() =>
            navigation.navigate('AttendanceReportScreen', { user })
          }
        >
          <Text style={styles.qaBtnIcon}>📊</Text>
          <Text style={styles.qaBtnText}>Report</Text>
        </TouchableOpacity>

        {isAdmin && (
          <>
            <TouchableOpacity
              style={styles.qaBtn}
              onPress={() =>
                navigation.navigate('AdminRouterScreen', {
                  user,
                  currentBssid: wifiInfo.bssid,
                  currentSsid: wifiInfo.ssid,
                })
              }
            >
              <Text style={styles.qaBtnIcon}>📡</Text>
              <Text style={styles.qaBtnText}>Routers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qaBtn}
              onPress={() =>
                navigation.navigate('EmployeeProfileScreen', { user })
              }
            >
              <Text style={styles.qaBtnIcon}>👥</Text>
              <Text style={styles.qaBtnText}>Employees</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Monitor banner ── */}
      <View style={styles.monitorBanner}>
        <View style={[styles.monitorDot, { backgroundColor: permissions.allGranted ? '#00C853' : '#FF6D00' }]} />
        <Text style={styles.monitorText}>
          {permissions.isChecking
            ? 'Checking permissions...'
            : permissions.allGranted
            ? `● Live — polling every 3s · Last: ${lastUpdated?.toLocaleTimeString() ?? '—'}`
            : '⚠️ Permissions required'}
        </Text>
      </View>

      <SectionLabel label="ATTENDANCE" />
      {permissions.isChecking ? (
        <LoadingCard message="Checking permissions..." />
      ) : (
        <AttendanceStatusCard session={session} />
      )}

      <SectionLabel label="OFFICE NETWORK" />
      <RouterVerificationCard verification={verification} />

      <SectionLabel label="CONNECTION HEALTH" />
      <ConnectionHealthCard wifiInfo={wifiInfo} lastUpdated={lastUpdated} isLoading={isLoading} />

      {isAdmin && (
        <>
          <SectionLabel label="LIVE MONITOR" />
          <EventLogCard monitorEvents={monitorEvents} attendanceEvents={attendanceEvents} />
        </>
      )}

      {/* ── Device Info (collapsible) ── */}
      <TouchableOpacity
        onPress={() => setDeviceInfoExpanded(v => !v)}
        activeOpacity={0.7}
        style={styles.deviceInfoToggle}
      >
        <Text style={styles.deviceInfoToggleText}>
          📱 Device Information {deviceInfoExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      {deviceInfoExpanded && <DeviceInfoCard deviceInfo={deviceInfo} />}

      {/* ── Admin controls ── */}
      {isAdmin && (
        <Card style={styles.adminCard} elevation={1}>
          <Card.Content>
            <Text style={styles.adminTitle}>⚙️ Admin Controls</Text>
            <Divider style={styles.adminDivider} />
            <TouchableOpacity onPress={resetSession} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Reset Current Session</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      )}

      <Text style={styles.footer}>Pull to refresh · Router-based attendance</Text>
    </ScrollView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card style={styles.loadingCard} elevation={1}>
      <Card.Content>
        <Text style={styles.loadingText}>{message}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#F0F2FF' },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, paddingTop: 20, backgroundColor: '#3F51B5',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 4,
  },
  welcomeText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  userName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 2 },
  userEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  roleChip: { height: 24 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  quickActions: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 16, marginTop: 10, marginBottom: 4,
  },
  qaBtn: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', elevation: 2,
    borderWidth: 1, borderColor: '#E8EAF6',
  },
  qaBtnIcon: { fontSize: 22, marginBottom: 4 },
  qaBtnText: { color: '#3F51B5', fontWeight: '700', fontSize: 11 },
  monitorBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E',
    marginHorizontal: 16, marginVertical: 6, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7, gap: 8,
  },
  monitorDot: { width: 7, height: 7, borderRadius: 3.5 },
  monitorText: { color: '#FFFFFF', fontSize: 11, fontWeight: '500', flex: 1 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#9E9E9E', letterSpacing: 1.5,
    textTransform: 'uppercase', marginTop: 12, marginBottom: 2, marginHorizontal: 20,
  },
  deviceInfoToggle: {
    marginHorizontal: 16, marginTop: 14, marginBottom: 2, paddingVertical: 10,
    paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 10, elevation: 1,
  },
  deviceInfoToggleText: { color: '#5C6BC0', fontWeight: '700', fontSize: 13 },
  adminCard: { marginHorizontal: 16, marginTop: 10, borderRadius: 12, backgroundColor: '#FFFDE7' },
  adminTitle: { fontWeight: '700', color: '#F57F17', marginBottom: 4 },
  adminDivider: { marginVertical: 8, backgroundColor: '#FFF9C4' },
  resetBtn: { backgroundColor: '#F57F17', borderRadius: 8, padding: 10, alignItems: 'center' },
  resetBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  loadingCard: { marginHorizontal: 16, marginVertical: 8, borderRadius: 12, backgroundColor: '#FFFFFF' },
  loadingText: { color: '#9E9E9E', textAlign: 'center', marginVertical: 12 },
  footer: { textAlign: 'center', color: '#9E9E9E', fontSize: 11, marginTop: 20, marginBottom: 8 },
});
