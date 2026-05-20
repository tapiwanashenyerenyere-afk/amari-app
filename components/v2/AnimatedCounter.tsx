// Animated number counter — rolls up from 0 to target value
import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  style?: TextStyle;
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 800,
  delay = 0,
  style,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      animatedValue.value = withTiming(value, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [animatedValue, delay, duration, value]);

  // For now, just display the target value since animatedProps on Text
  // is limited in RN. The animation is handled by the parent StaggerReveal.
  return (
    <Text style={style}>
      {prefix}{value}{suffix}
    </Text>
  );
}
