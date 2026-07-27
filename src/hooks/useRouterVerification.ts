/**
 * useRouterVerification.ts — Compares current BSSID against the trusted router list.
 *
 * WHY BSSID:
 * SSID is just a name — spoofable. BSSID is the hardware MAC address of the access
 * point. It uniquely identifies a specific physical router, not just a network name.
 *
 * This hook is purely derived state — it takes the current WiFi info and runs the
 * BSSID lookup. No polling, no timers. Fast and synchronous.
 */
import { useMemo } from 'react';
import { findTrustedRouter } from '../config/trustedRouters';
import type { RouterVerificationState, WifiInfo } from '../types';

export function useRouterVerification(wifiInfo: WifiInfo): RouterVerificationState {
  return useMemo(() => {
    // Not connected at all — can't be verified
    if (!wifiInfo.isConnected || !wifiInfo.bssid || wifiInfo.bssid === 'N/A') {
      return {
        isVerified: false,
        matchedRouter: null,
        currentBssid: wifiInfo.bssid,
        currentSsid: wifiInfo.ssid,
      };
    }

    const matched = findTrustedRouter(wifiInfo.bssid);

    return {
      isVerified: matched !== null,
      matchedRouter: matched,
      currentBssid: wifiInfo.bssid,
      currentSsid: wifiInfo.ssid,
    };
  }, [wifiInfo.isConnected, wifiInfo.bssid, wifiInfo.ssid]);
}
