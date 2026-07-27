/**
 * SignalMeter — Visual signal strength indicator with animated progress bar.
 *
 * Shows:
 * - Color-coded quality label (Excellent/Good/Fair/Weak/Poor)
 * - Animated progress bar (0–100%)
 * - Raw RSSI value in dBm
 * - Five signal bar icons
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  formatRssi,
  getSignalCategory,
  rssiToProgress,
} from '../utils/signalUtils';

interface Props {
  rssi: number;
  isConnected: boolean;
}

export function SignalMeter({ rssi, isConnected }: Props) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const category = getSignalCategory(isConnected ? rssi : 0);
  const progress = isConnected ? rssiToProgress(rssi) : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Five signal bars — filled based on signal level
  const bars = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <View style={styles.container}>
      {/* Quality label row */}
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: category.color }]} />
        <Text style={[styles.qualityLabel, { color: category.color }]}>
          {category.label}
        </Text>
        <Text style={styles.rssiValue}>{formatRssi(isConnected ? rssi : 0)}</Text>
      </View>

      {/* Animated progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: barWidth, backgroundColor: category.color },
          ]}
        />
      </View>

      {/* Five signal bars visualization */}
      <View style={styles.barsContainer}>
        {bars.map((threshold, index) => {
          const filled = isConnected && progress >= threshold;
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height: 8 + index * 5, // Each bar is taller than the previous
                  backgroundColor: filled ? category.color : '#E0E0E0',
                  opacity: filled ? 1 : 0.4,
                },
              ]}
            />
          );
        })}
        <Text style={styles.barsLabel}>Signal</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{category.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  qualityLabel: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  rssiValue: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 10,
  },
  bar: {
    width: 20,
    borderRadius: 3,
  },
  barsLabel: {
    color: '#9E9E9E',
    fontSize: 11,
    marginLeft: 8,
    marginBottom: 2,
  },
  description: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
