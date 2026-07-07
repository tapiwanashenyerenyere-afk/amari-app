import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { hapticTouch, houseSpring, PRESS_SCALE } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  haptic?: boolean;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

// The house press: every touchable settles on the same spring and speaks
// the same haptic grammar. Use in place of bare Pressable for cards and
// tiles so the whole app moves as one object.
export function PressableScale({
  children,
  haptic = true,
  onPressIn,
  onPressOut,
  scaleTo = PRESS_SCALE,
  style,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, houseSpring);
        if (haptic) {
          hapticTouch();
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, houseSpring);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
