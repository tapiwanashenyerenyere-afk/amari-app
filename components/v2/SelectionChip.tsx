import { Pressable, StyleSheet, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

export interface SelectionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'light' | 'dark';
  disabled?: boolean;
  testID?: string;
}

export function SelectionChip({
  label,
  selected,
  onPress,
  variant = 'light',
  disabled = false,
  testID,
}: SelectionChipProps) {
  const dark = variant === 'dark';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      hitSlop={2}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.root,
        dark ? styles.dark : styles.light,
        selected && (dark ? styles.darkSelected : styles.lightSelected),
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {selected ? (
        <Check
          color={dark ? colors.black : colors.white}
          size={15}
          strokeWidth={2.8}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          dark ? styles.darkLabel : styles.lightLabel,
          selected && (dark ? styles.darkLabelSelected : styles.lightLabelSelected),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 44,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  light: {
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: colors.white,
  },
  lightSelected: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  dark: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  darkSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  label: {
    flexShrink: 1,
    fontFamily: typography.body.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  lightLabel: {
    color: colors.black,
  },
  lightLabelSelected: {
    color: colors.white,
  },
  darkLabel: {
    color: 'rgba(255,255,255,0.82)',
  },
  darkLabelSelected: {
    color: colors.black,
    fontFamily: typography.body.semiBold,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
});
