import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, T, R } from '../../lib/constants';
import type { MembershipTier } from '../../lib/constants';

const TIER_PILL_COLORS: Record<
  MembershipTier,
  { text: string; border: string; bg: string }
> = {
  member: {
    text: C.lightSecondary,
    border: 'rgba(255,255,255,0.1)',
    bg: 'rgba(255,255,255,0.06)',
  },
  silver: {
    text: '#C0C0C0',
    border: 'rgba(192,192,192,0.2)',
    bg: 'rgba(192,192,192,0.08)',
  },
  platinum: {
    text: '#E5E4E2',
    border: 'rgba(229,228,226,0.2)',
    bg: 'rgba(229,228,226,0.08)',
  },
  laureate: {
    text: C.goldOnDark,
    border: 'rgba(201,169,98,0.2)',
    bg: 'rgba(201,169,98,0.08)',
  },
};

interface TierBadgeProps {
  tier: MembershipTier;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const colors = TIER_PILL_COLORS[tier];
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <View
      style={[
        styles.pill,
        { borderColor: colors.border, backgroundColor: colors.bg },
      ]}
    >
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: R.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...T.label,
    fontSize: 9,
    letterSpacing: 3,
  },
});
