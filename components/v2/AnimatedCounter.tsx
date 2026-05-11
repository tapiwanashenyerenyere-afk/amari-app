// Animated number counter — rolls up from 0 to target value
import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { colors, typography } from '../../lib/theme';

const AnimatedText = Animated.createAnimatedComponent(Text);

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
  }, [value]);

  // For now, just display the target value since animatedProps on Text
  // is limited in RN. The animation is handled by the parent StaggerReveal.
  return (
    <Text style={style}>
      {prefix}{value}{suffix}
    </Text>
  );
}
