/**
 * signalUtils.ts — Convert raw RSSI values to human-readable signal quality.
 *
 * RSSI (Received Signal Strength Indicator) is measured in dBm (decibels relative
 * to one milliwatt). It is always negative — closer to zero is stronger.
 *
 * Standard RSSI thresholds used by Android's WifiManager:
 *   > -50 dBm  → Excellent (5 bars)
 *   > -60 dBm  → Good      (4 bars)
 *   > -70 dBm  → Fair      (3 bars)
 *   > -80 dBm  → Weak      (2 bars)
 *   ≤ -80 dBm  → Poor      (1 bar)
 */
import type { SignalCategory, SignalQuality } from '../types';

// Color palette — uses a traffic-light system (green → red)
export const SIGNAL_COLORS = {
  Excellent: '#00C853',  // Material Green A700
  Good: '#64DD17',       // Material Light Green A700
  Fair: '#FFD600',       // Material Yellow A700
  Weak: '#FF6D00',       // Material Orange A700
  Poor: '#D50000',       // Material Red A700
  'No Signal': '#9E9E9E', // Material Grey 500
} as const;

/**
 * Convert an RSSI value (dBm) to a signal quality category.
 */
export function getRssiCategory(rssi: number): SignalQuality {
  if (rssi === 0) return 'No Signal';
  if (rssi > -50) return 'Excellent';
  if (rssi > -60) return 'Good';
  if (rssi > -70) return 'Fair';
  if (rssi > -80) return 'Weak';
  return 'Poor';
}

/**
 * Get full signal category info including color and description.
 */
export function getSignalCategory(rssi: number): SignalCategory {
  const label = getRssiCategory(rssi);

  const descriptions: Record<SignalQuality, string> = {
    Excellent: 'Outstanding signal. Maximum performance.',
    Good: 'Strong signal. Reliable connection.',
    Fair: 'Adequate signal. Most tasks will work.',
    Weak: 'Marginal signal. May experience slowdowns.',
    Poor: 'Very weak signal. Frequent drops expected.',
    'No Signal': 'No WiFi connection detected.',
  };

  const icons: Record<SignalQuality, string> = {
    Excellent: 'wifi',
    Good: 'wifi',
    Fair: 'wifi',
    Weak: 'wifi-strength-2',
    Poor: 'wifi-strength-1',
    'No Signal': 'wifi-off',
  };

  return {
    label,
    color: SIGNAL_COLORS[label],
    description: descriptions[label],
    icon: icons[label],
  };
}

/**
 * Convert RSSI to a 0.0–1.0 progress value for visual meters.
 * Maps the range -90 dBm (0%) to -30 dBm (100%).
 */
export function rssiToProgress(rssi: number): number {
  if (rssi === 0) return 0;
  const min = -90;
  const max = -30;
  const clamped = Math.max(min, Math.min(max, rssi));
  return (clamped - min) / (max - min);
}

/**
 * Format RSSI for display with the dBm unit.
 */
export function formatRssi(rssi: number): string {
  if (rssi === 0) return 'N/A';
  return `${rssi} dBm`;
}

/**
 * Convert frequency (MHz) to a display-friendly band label.
 */
export function getBandLabel(frequency: number): string {
  if (frequency === 0) return 'N/A';
  if (frequency >= 2400 && frequency <= 2500) return `2.4 GHz (${frequency} MHz)`;
  if (frequency >= 4900 && frequency <= 5900) return `5 GHz (${frequency} MHz)`;
  if (frequency >= 5925) return `6 GHz (${frequency} MHz)`;
  return `${frequency} MHz`;
}
