import type { RefObject } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface BriefingActionRowProps {
  onTuneInterests: () => void;
  onFollowWorld: () => void;
  followButtonRef?: RefObject<View | null>;
}

export function BriefingActionRow({
  onTuneInterests,
  onFollowWorld,
  followButtonRef,
}: BriefingActionRowProps) {
  return (
    <View accessibilityRole="toolbar" style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={onTuneInterests}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Text style={styles.actionText}>Tune interests</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onFollowWorld}
        ref={followButtonRef}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Text style={styles.actionText}>Follow your world</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  action: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.16)',
    backgroundColor: colors.bone,
  },
  actionText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.black,
    textAlign: 'center',
  },
  pressed: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
