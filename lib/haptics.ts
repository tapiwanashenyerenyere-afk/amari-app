/**
 * Haptic feedback utilities
 * Provides consistent haptic feedback across the app
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Only run haptics on native platforms
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light tap feedback - use for button presses
 */
export const tapHaptic = async () => {
  if (isNative) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Selection feedback - use for card selections, toggles
 */
export const selectionHaptic = async () => {
  if (isNative) {
    await Haptics.selectionAsync();
  }
};

/**
 * Success feedback - use for save, confirm actions
 */
export const successHaptic = async () => {
  if (isNative) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Error feedback - use for failures, validation errors
 */
export const errorHaptic = async () => {
  if (isNative) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

/**
 * Warning feedback - use for warnings, destructive action confirmations
 */
export const warningHaptic = async () => {
  if (isNative) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Medium impact - use for more prominent interactions
 */
export const mediumHaptic = async () => {
  if (isNative) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};
