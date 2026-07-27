/**
 * usePermissions.ts — Hook to request and track all WiFi-related permissions.
 *
 * WHY THESE PERMISSIONS:
 * - ACCESS_FINE_LOCATION: Required on Android 8.1-11 to read SSID/BSSID from WifiInfo.
 *   Without it, getSSID() returns "<unknown ssid>".
 * - NEARBY_WIFI_DEVICES: New in Android 12 (API 31). Required for WiFi scanning.
 *   We mark it neverForLocation in the manifest so it doesn't imply location data.
 * - On API < 31, only fine location is checked. On API >= 31, we check both.
 *
 * LIBRARY: react-native-permissions v5 — supports New Architecture via codegenConfig.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';
import type { PermissionState, PermissionStatus } from '../types';

const INITIAL_STATE: PermissionState = {
  fineLocation: 'unavailable',
  coarseLocation: 'unavailable',
  nearbyWifi: 'unavailable',
  allGranted: false,
  isChecking: true,
};

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>(INITIAL_STATE);

  const mapResult = (result: string): PermissionStatus => {
    switch (result) {
      case RESULTS.GRANTED:
        return 'granted';
      case RESULTS.DENIED:
        return 'denied';
      case RESULTS.BLOCKED:
        return 'blocked';
      case RESULTS.LIMITED:
        return 'limited';
      default:
        return 'unavailable';
    }
  };

  const checkPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setPermissions({ ...INITIAL_STATE, isChecking: false, allGranted: true });
      return;
    }

    setPermissions(prev => ({ ...prev, isChecking: true }));

    const fineResult = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    const coarseResult = await check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);

    // NEARBY_WIFI_DEVICES only exists on Android 12+ (API 31)
    let nearbyResult: PermissionStatus = 'unavailable';
    if (Platform.Version >= 31) {
      const r = await check(PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES);
      nearbyResult = mapResult(r);
    }

    const fine = mapResult(fineResult);
    const coarse = mapResult(coarseResult);

    // allGranted: we need at minimum fine location for SSID reads
    const allGranted =
      fine === 'granted' &&
      (Platform.Version < 31 || nearbyResult === 'granted');

    setPermissions({
      fineLocation: fine,
      coarseLocation: coarse,
      nearbyWifi: nearbyResult,
      allGranted,
      isChecking: false,
    });
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    setPermissions(prev => ({ ...prev, isChecking: true }));

    // Request fine + coarse location
    const fineResult = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, {
      title: 'Location Permission Required',
      message:
        'This app needs location access to read WiFi network information (SSID, signal strength).\n\nAndroid requires location permission to access WiFi details.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });

    const coarseResult = await request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);

    let nearbyResult: PermissionStatus = 'unavailable';
    if (Platform.Version >= 31) {
      const r = await request(PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES, {
        title: 'Nearby WiFi Devices',
        message:
          'This app needs Nearby WiFi Devices permission to scan for networks on Android 12+.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
      nearbyResult = mapResult(r);
    }

    const fine = mapResult(fineResult);
    const coarse = mapResult(coarseResult);
    const allGranted =
      fine === 'granted' &&
      (Platform.Version < 31 || nearbyResult === 'granted');

    setPermissions({
      fineLocation: fine,
      coarseLocation: coarse,
      nearbyWifi: nearbyResult,
      allGranted,
      isChecking: false,
    });

    // If still blocked after request, guide the user to settings
    if (fine === 'blocked') {
      Alert.alert(
        'Permission Blocked',
        'Location permission has been permanently denied. Please enable it in Settings to use WiFi monitoring.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ],
      );
    }

    return allGranted;
  }, []);

  const openAppSettings = useCallback(() => {
    if (Platform.OS === 'android') {
      openSettings();
    } else {
      Linking.openSettings();
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    permissions,
    requestPermissions,
    checkPermissions,
    openAppSettings,
  };
}
