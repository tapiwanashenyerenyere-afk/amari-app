import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '../../lib/theme';

type MembershipTier = 'member' | 'silver' | 'gold' | 'platinum' | 'laureate';

const TIER_PILL_COLORS: Record<MembershipTier, { text: string; border: string; bg: string }> = {
  member: {
    text: colors.gray,
    border: colors.rule,
    bg: colors.ghost,
  },
  silver: {
    text: '#9A9A94',
    border: 'rgba(154,154,148,0.2)',
    bg: 'rgba(154,154,148,0.08)',
  },
  gold: {
    text: colors.goldDark,
    border: 'rgba(196,162,101,0.25)',
    bg: 'rgba(196,162,101,0.08)',
  },
  platinum: {
    text: '#C8C4BC',
    border: 'rgba(200,196,188,0.2)',
    bg: 'rgba(200,196,188,0.08)',
  },
  laureate: {
    text: colors.sand,
    border: 'rgba(139,115,85,0.2)',
    bg: 'rgba(139,115,85,0.08)',
  },
};

interface TierBadgeProps {
  tier: MembershipTier;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const c = TIER_PILL_COLORS[tier];
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <View style={[styles.pill, { borderColor: c.border, backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: typography.geo.medium,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
