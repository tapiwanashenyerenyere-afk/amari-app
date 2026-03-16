import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows } from '../../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface WhiteCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  static?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function WhiteCard({ children, onPress, style, static: isStatic, accessibilityLabel, accessibilityHint }: WhiteCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isStatic) {
      scale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle, style]}
      disabled={isStatic && !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: 8,
    ...shadows.card,
    overflow: 'hidden',
  },
});
