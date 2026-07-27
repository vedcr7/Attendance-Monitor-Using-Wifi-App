/**
 * useDeviceInfo.ts — Hook to fetch static device identification data.
 *
 * WHY react-native-device-info:
 * - Provides stable Android ID, manufacturer, model, OS version
 * - Version 15.x supports New Architecture (listed in RN 0.86 compatible libs)
 * - The deviceId is the Android Settings.Secure.ANDROID_ID — unique per app/device
 *   and does NOT change on reboot (unlike randomly generated UUIDs)
 *
 * DATA SOURCE:
 * - react-native-device-info reads from Android system APIs:
 *   Build.MANUFACTURER, Build.MODEL, Build.VERSION.RELEASE, etc.
 */
import { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';
import type { DeviceInfo as DeviceInfoType } from '../types';

const INITIAL_STATE: DeviceInfoType = {
  deviceId: 'Loading...',
  deviceName: 'Loading...',
  manufacturer: 'Loading...',
  model: 'Loading...',
  androidVersion: 'Loading...',
  apiLevel: 0,
  brand: 'Loading...',
  isLoading: true,
};

export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoType>(INITIAL_STATE);

  useEffect(() => {
    let isMounted = true;

    async function loadDeviceInfo() {
      try {
        // These calls are async but read cached system values — fast
        const [
          deviceId,
          deviceName,
          manufacturer,
          model,
          androidVersion,
          apiLevel,
          brand,
        ] = await Promise.all([
          DeviceInfo.getUniqueId(),       // Android ID — stable unique identifier
          DeviceInfo.getDeviceName(),      // e.g. "John's Phone"
          DeviceInfo.getManufacturer(),    // e.g. "Samsung"
          DeviceInfo.getModel(),           // e.g. "SM-G991B"
          DeviceInfo.getSystemVersion(),   // e.g. "14"
          DeviceInfo.getApiLevel(),        // e.g. 34
          DeviceInfo.getBrand(),           // e.g. "samsung"
        ]);

        if (isMounted) {
          setDeviceInfo({
            deviceId,
            deviceName,
            manufacturer,
            model,
            androidVersion,
            apiLevel,
            brand: brand.charAt(0).toUpperCase() + brand.slice(1), // Capitalize
            isLoading: false,
          });
        }
      } catch (error) {
        if (isMounted) {
          setDeviceInfo(prev => ({
            ...prev,
            deviceId: 'Unavailable',
            deviceName: 'Unavailable',
            isLoading: false,
          }));
        }
      }
    }

    loadDeviceInfo();
    return () => { isMounted = false; };
  }, []);

  return deviceInfo;
}
