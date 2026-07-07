import * as Haptics from 'expo-haptics';
import type { WithSpringConfig } from 'react-native-reanimated';

// The AMARI motion signature. One spring, one press depth, one haptic
// grammar — applied everywhere so the app moves as a single object.
// Damping ratio ≈ 0.7, perceptual settle ≈ 300ms.

export const houseSpring: WithSpringConfig = {
  damping: 14,
  stiffness: 170,
  mass: 0.6,
};

export const houseSpringSoft: WithSpringConfig = {
  damping: 18,
  stiffness: 120,
  mass: 0.8,
};

export const PRESS_SCALE = 0.97;
export const PRESS_SCALE_DEEP = 0.94;

// Haptic grammar: light on touch, selection on settle, notification
// reserved for outcomes (ticket issued, connection made).
export function hapticTouch() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticSettle() {
  Haptics.selectionAsync();
}

export function hapticOutcome(success = true) {
  Haptics.notificationAsync(
    success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
  );
}
