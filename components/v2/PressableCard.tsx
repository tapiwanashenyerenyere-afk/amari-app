// Enhanced pressable card with spring physics, subtle scale + shadow shift
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows } from '../../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 12, stiffness: 200, mass: 0.8 };

interface PressableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  dark?: boolean;
  borderRadius?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function PressableCard({
  children,
  onPress,
  style,
  dark = false,
  borderRadius = radius.md,
  accessibilityLabel,
  accessibilityHint,
}: PressableCardProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.975]);
    const shadowOpacity = interpolate(pressed.value, [0, 1], [0.03, 0.08]);
    const translateY = interpolate(pressed.value, [0, 1], [0, 1]);

    return {
      transform: [{ scale }, { translateY }],
      shadowOpacity,
    };
  });

  return (
    <AnimatedPressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      onPressIn={() => {
        pressed.value = withSpring(1, SPRING_CONFIG);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, SPRING_CONFIG);
      }}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[
        {
          backgroundColor: dark ? colors.black : colors.white,
          borderRadius,
          marginBottom: 8,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 6,
          elevation: 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
