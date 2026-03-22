import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AmariEmblem } from '@/components/v2/AmariEmblem';
import type { MembershipTier } from '@/types/db-helpers';
import { TIER_CARD_STYLES } from './TierStyles';

interface CardEmblemProps {
  tier: MembershipTier;
  size: number;
}

export function CardEmblem({ tier, size }: CardEmblemProps) {
  const palette = TIER_CARD_STYLES[tier];

  return (
    <View style={[styles.container, { opacity: palette.emblemOpacity }]} pointerEvents="none">
      <AmariEmblem
        size={size}
        fill="transparent"
        foreground={palette.emblemColor}
        borderRadius={18}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: -18,
    bottom: -18,
  },
});
