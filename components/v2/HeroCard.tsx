import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HeroCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function HeroCard({ children, onPress, style, accessibilityLabel }: HeroCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[styles.card, animatedStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Ambient gradient overlay */}
      <View style={styles.ambient}>
        <LinearGradient
          colors={['rgba(160,133,107,0.12)', 'transparent']}
          start={{ x: 0.7, y: 0.2 }}
          end={{ x: 0.3, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.content}>{children}</View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  ambient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'relative',
  },
});
