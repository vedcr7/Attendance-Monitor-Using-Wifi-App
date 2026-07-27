/**
 * WifiModule.ts — TypeScript bridge to our Kotlin WifiModule native module.
 *
 * WHY: NativeModules is untyped by default. This file wraps it with proper
 * TypeScript types so every caller gets full autocomplete and type safety.
 *
 * The name 'WifiModule' must match exactly what WifiModule.kt returns from getName().
 */
import { NativeModules, Platform } from 'react-native';
import type { WifiInfo } from '../types';

interface WifiNativeModule {
  getWifiInfo(): Promise<WifiInfo>;
  isWifiEnabled(): Promise<boolean>;
}

// Guard: this module only exists on Android
const { WifiModule } = NativeModules;

if (Platform.OS === 'android' && !WifiModule) {
  console.warn(
    '[WifiModule] Native module not found. Did you rebuild the Android app after adding WifiPackage?',
  );
}

const WifiBridge: WifiNativeModule = {
  getWifiInfo: (): Promise<WifiInfo> => {
    if (Platform.OS !== 'android' || !WifiModule) {
      return Promise.resolve({
        isConnected: false,
        isWifiEnabled: false,
        ssid: 'Not available on this platform',
        bssid: 'N/A',
        ipAddress: 'N/A',
        rssi: 0,
        signalLevel: 0,
        frequency: 0,
        band: 'N/A',
        linkSpeed: 0,
        networkId: 'N/A',
        hiddenSsid: false,
        networkType: 'N/A',
        hasInternet: false,
        error: 'Android only',
      });
    }
    return WifiModule.getWifiInfo();
  },

  isWifiEnabled: (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !WifiModule) {
      return Promise.resolve(false);
    }
    return WifiModule.isWifiEnabled();
  },
};

export default WifiBridge;
