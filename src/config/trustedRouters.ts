/**
 * trustedRouters.ts
 *
 * Source of truth for trusted routers has two layers:
 *   1. Runtime (AsyncStorage) — managed via Admin Router Screen, takes priority
 *   2. Static fallback (STATIC_TRUSTED_ROUTERS) — used if storage is empty
 *
 * This means admins can add/remove routers without a code deploy.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrustedRouter {
  id: number;
  name: string;
  bssid: string;
  location?: string;
}

export const DEV_MODE = false;  

// Static fallback — what you set in code before using the admin screen
export const STATIC_TRUSTED_ROUTERS: TrustedRouter[] = [
  {
    id: 1,
    name: 'Office Router Main',
    bssid: '30:4f:75:f9:52:29',
    location: 'Main Office',
  },
];

// In-memory cache so every lookup doesn't hit AsyncStorage
let _runtimeRouters: TrustedRouter[] | null = null;

/** Call once at app start (or after saving) to prime the cache. */
export async function initTrustedRouters(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem('wta_trusted_routers');
    if (raw) {
      const parsed: TrustedRouter[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        _runtimeRouters = parsed;
        return;
      }
    }
  } catch {}
  _runtimeRouters = null; // fall through to static list
}

/** Invalidate cache — call after saving routers in the admin screen. */
export function invalidateRouterCache(): void {
  _runtimeRouters = null;
}

/** Get the active router list (runtime if available, else static). */
export function getActiveTrustedRouters(): TrustedRouter[] {
  return _runtimeRouters ?? STATIC_TRUSTED_ROUTERS;
}

/**
 * Find a trusted router by BSSID.
 * DEV_MODE bypasses the list and matches anything.
 */
export function findTrustedRouter(bssid: string): TrustedRouter | null {
  if (DEV_MODE) {
    return {
      id: 0,
      name: `Dev Router (${bssid})`,
      bssid,
      location: 'Development Mode',
    };
  }
  if (!bssid || bssid === 'N/A' || bssid === '02:00:00:00:00:00') return null;
  const norm = bssid.toUpperCase().trim();
  return (
    getActiveTrustedRouters().find(r => r.bssid.toUpperCase() === norm) ?? null
  );
}

export function isTrustedBssid(bssid: string): boolean {
  return findTrustedRouter(bssid) !== null;
}
