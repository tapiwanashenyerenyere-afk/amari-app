import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radius, shadows } from '../../lib/theme';
import { tapHaptic } from '../../lib/haptics';

interface QuickActionsProps {
  matchCount: number;
  opportunityCount: number;
  eventCount: number;
}

interface ActionCardProps {
  letter: string;
  letterColor: string;
  label: string;
  count: number;
  countSuffix: string;
  onPress: () => void;
}

function ActionCard({ letter, letterColor, label, count, countSuffix, onPress }: ActionCardProps) {
  const handlePress = () => {
    tapHaptic();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${count} ${countSuffix}`}
      style={styles.card}
    >
      <View style={[styles.iconCircle, { backgroundColor: letterColor + '18' }]}>
        <Text style={[styles.iconLetter, { color: letterColor }]}>{letter}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.count}>
        {count} {countSuffix}
      </Text>
    </Pressable>
  );
}

export function QuickActions({ matchCount, opportunityCount, eventCount }: QuickActionsProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ActionCard
        letter="A"
        letterColor={colors.sand}
        label="Aligned"
        count={matchCount}
        countSuffix={matchCount === 1 ? 'new match' : 'new matches'}
        onPress={() => router.push('/(tabs)/aligned')}
      />
      <ActionCard
        letter="C"
        letterColor={colors.gray}
        label="Corridor"
        count={opportunityCount}
        countSuffix={opportunityCount === 1 ? 'opportunity' : 'opportunities'}
        onPress={() => router.push('/(tabs)/corridor')}
      />
      <ActionCard
        letter="E"
        letterColor={colors.sandOnDark}
        label="Events"
        count={eventCount}
        countSuffix="upcoming"
        onPress={() => router.push('/(tabs)/events')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.rule,
    padding: spacing.md,
    ...shadows.card,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconLetter: {
    fontFamily: typography.geo.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontFamily: typography.geo.medium,
    fontSize: 11,
    color: colors.black,
    marginBottom: 2,
  },
  count: {
    fontFamily: typography.body.regular,
    fontSize: 10,
    color: colors.gray,
  },
});
