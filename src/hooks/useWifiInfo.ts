/**
 * useWifiInfo.ts — Hook that polls WiFi data every 3 seconds and tracks changes.
 *
 * WHY POLLING (not events):
 * Android's WifiManager doesn't expose a stable callback/event system accessible
 * from Old or New Architecture React Native bridges. The reliable cross-version
 * approach is periodic polling. 3 seconds is the sweet spot — responsive enough
 * to feel live, but not hammering the CPU.
 *
 * CHANGE DETECTION:
 * We compare SSID, RSSI, and connection status on each poll. When any of these
 * change, we update state and record the change in a log for display.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import WifiBridge from '../native/WifiModule';
import type { WifiInfo } from '../types';

const POLL_INTERVAL_MS = 3000;

interface WifiChange {
  timestamp: Date;
  message: string;
  type: 'connected' | 'disconnected' | 'ssid' | 'signal' | 'initial';
}

interface UseWifiInfoReturn {
  wifiInfo: WifiInfo | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  changeLog: WifiChange[];
  refresh: () => void;
}

const DEFAULT_WIFI: WifiInfo = {
  isConnected: false,
  isWifiEnabled: false,
  ssid: 'Unknown',
  bssid: 'N/A',
  ipAddress: 'N/A',
  rssi: 0,
  signalLevel: 0,
  frequency: 0,
  band: 'N/A',
  linkSpeed: 0,
  networkId: 'N/A',
  hiddenSsid: false,
  networkType: 'None',
  hasInternet: false,
};

export function useWifiInfo(enabled: boolean = true): UseWifiInfoReturn {
  const [wifiInfo, setWifiInfo] = useState<WifiInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [changeLog, setChangeLog] = useState<WifiChange[]>([]);

  // Refs to track previous state without triggering re-renders
  const prevInfoRef = useRef<WifiInfo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addChange = useCallback((message: string, type: WifiChange['type']) => {
    setChangeLog(prev => [
      { timestamp: new Date(), message, type },
      ...prev.slice(0, 9), // Keep last 10 changes
    ]);
  }, []);

  const fetchWifiInfo = useCallback(async () => {
    try {
      const info = await WifiBridge.getWifiInfo();
      const now = new Date();
      const prev = prevInfoRef.current;

      // --- Change detection ---
      if (prev === null) {
        // Initial load
        addChange(
          info.isConnected ? `Connected to ${info.ssid}` : 'Not connected',
          'initial',
        );
      } else {
        // Connection state changed
        if (prev.isConnected !== info.isConnected) {
          if (info.isConnected) {
            addChange(`Connected to ${info.ssid}`, 'connected');
          } else {
            addChange(`Disconnected from ${prev.ssid}`, 'disconnected');
          }
        }
        // SSID changed (network switch)
        else if (info.isConnected && prev.ssid !== info.ssid) {
          addChange(`Network changed: ${prev.ssid} → ${info.ssid}`, 'ssid');
        }
        // Significant RSSI change (more than 5 dBm)
        else if (
          info.isConnected &&
          prev.rssi !== 0 &&
          info.rssi !== 0 &&
          Math.abs(prev.rssi - info.rssi) >= 5
        ) {
          addChange(
            `Signal changed: ${prev.rssi} → ${info.rssi} dBm`,
            'signal',
          );
        }
      }

      prevInfoRef.current = info;
      setWifiInfo(info);
      setLastUpdated(now);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch WiFi info';
      setError(message);
      // Don't clear existing data on transient errors
    } finally {
      setIsLoading(false);
    }
  }, [addChange]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchWifiInfo();
  }, [fetchWifiInfo]);

  useEffect(() => {
    if (!enabled) return;

    // Immediate first fetch
    fetchWifiInfo();

    // Poll every 3 seconds
    intervalRef.current = setInterval(fetchWifiInfo, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, fetchWifiInfo]);

  return {
    wifiInfo: wifiInfo ?? DEFAULT_WIFI,
    isLoading,
    error,
    lastUpdated,
    changeLog,
    refresh,
  };
}
