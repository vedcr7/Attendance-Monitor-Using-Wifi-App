/**
 * useWifiMonitor.ts — Core WiFi polling hook that feeds all downstream logic.
 *
 * This replaces the direct use of useWifiInfo in the dashboard. It polls
 * the native module, tracks changes, and exposes a clean interface for
 * useRouterVerification and useAttendanceState to consume.
 *
 * POLLING: every 3 seconds (ATTENDANCE_CONFIG.POLL_INTERVAL_MS)
 * CHANGE DETECTION: connection state, SSID, BSSID, RSSI (>5 dBm delta)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ATTENDANCE_CONFIG } from '../config/attendanceConfig';
import WifiBridge from '../native/WifiModule';
import type { AttendanceEvent, WifiInfo } from '../types';

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

interface UseWifiMonitorReturn {
  wifiInfo: WifiInfo;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  events: AttendanceEvent[];
  refresh: () => void;
}

let eventIdCounter = 0;
function makeEventId(): string {
  return `evt_${Date.now()}_${++eventIdCounter}`;
}

export function useWifiMonitor(enabled: boolean = true): UseWifiMonitorReturn {
  const [wifiInfo, setWifiInfo] = useState<WifiInfo>(DEFAULT_WIFI);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);

  const prevInfoRef = useRef<WifiInfo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addEvent = useCallback((message: string, type: AttendanceEvent['type']) => {
    const event: AttendanceEvent = {
      id: makeEventId(),
      timestamp: new Date(),
      message,
      type,
    };
    setEvents(prev => [event, ...prev].slice(0, ATTENDANCE_CONFIG.MAX_EVENT_LOG_ENTRIES));
  }, []);

  const fetchWifi = useCallback(async () => {
    try {
      const info = await WifiBridge.getWifiInfo();
      const prev = prevInfoRef.current;

      if (prev === null) {
        // Initial read
        addEvent(
          info.isConnected ? `Connected to ${info.ssid}` : 'Monitoring started — not connected',
          'initial',
        );
      } else {
        // Connection state change
        if (prev.isConnected !== info.isConnected) {
          if (info.isConnected) {
            addEvent(`Connected to ${info.ssid} (${info.bssid})`, 'connected');
          } else {
            addEvent(`Disconnected from ${prev.ssid}`, 'disconnected');
          }
        }
        // SSID/BSSID change (network switch while staying connected)
        else if (info.isConnected && prev.bssid !== info.bssid) {
          addEvent(`Network changed: ${prev.ssid} → ${info.ssid}`, 'connected');
        }
        // Significant signal change (≥5 dBm)
        else if (
          info.isConnected &&
          prev.rssi !== 0 &&
          info.rssi !== 0 &&
          Math.abs(prev.rssi - info.rssi) >= 5
        ) {
          addEvent(`Signal: ${prev.rssi} → ${info.rssi} dBm`, 'signal_change');
        }
      }

      prevInfoRef.current = info;
      setWifiInfo(info);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read WiFi');
    } finally {
      setIsLoading(false);
    }
  }, [addEvent]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchWifi();
  }, [fetchWifi]);

  useEffect(() => {
    if (!enabled) return;

    fetchWifi();
    intervalRef.current = setInterval(fetchWifi, ATTENDANCE_CONFIG.POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchWifi]);

  return { wifiInfo, isLoading, error, lastUpdated, events, refresh };
}
