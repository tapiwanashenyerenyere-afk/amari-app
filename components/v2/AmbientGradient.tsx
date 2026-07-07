import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface AmbientGradientProps {
  color?: string;
  durationMs?: number;
  intensity?: number;
  size?: number;
}

// Ambient life for dark surfaces: a soft light source that drifts on a
// slow loop, so black cards read as inhabited rather than printed.
// Purely decorative — sits behind content, never intercepts touches.
export function AmbientGradient({
  color = '196,162,101',
  durationMs = 14000,
  intensity = 0.05,
  size = 220,
}: AmbientGradientProps) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift, durationMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift.value * size * 0.35 },
      { translateY: drift.value * size * -0.2 },
      { scale: 1 + drift.value * 0.15 },
    ],
    opacity: intensity * (0.7 + drift.value * 0.3),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `rgba(${color},1)`,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    top: -40,
    right: -50,
  },
});
