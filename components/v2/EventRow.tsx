import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WhiteCard } from './WhiteCard';
import { colors, typography } from '../../lib/theme';

interface EventRowProps {
  day: string;
  month: string;
  title: string;
  meta: string;
  tier?: string;
  dimDate?: boolean;
  onPress?: () => void;
}

export function EventRow({ day, month, title, meta, tier, dimDate, onPress }: EventRowProps) {
  return (
    <WhiteCard onPress={onPress} accessibilityLabel={`${title}, ${month} ${day}. ${meta}`} accessibilityHint="Tap to view event details">
      <View style={styles.row}>
        <View style={styles.dateBlock}>
          <Text style={[styles.day, dimDate && styles.dayDim]}>{day}</Text>
          <Text style={styles.month}>{month}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
        </View>
        {tier && <Text style={styles.tierBadge}>{tier}</Text>}
      </View>
    </WhiteCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 13,
    paddingHorizontal: 16,
  },
  dateBlock: {
    width: 42,
    alignItems: 'center',
    flexShrink: 0,
  },
  day: {
    fontFamily: typography.serif.medium,
    fontSize: 24,
    fontWeight: '500',
    color: colors.black,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  dayDim: {
    color: colors.grayLight,
  },
  month: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    color: colors.sand,
    letterSpacing: 1,
    marginTop: 2,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.black,
  },
  meta: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
    marginTop: 1,
  },
  tierBadge: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    color: colors.sand,
    backgroundColor: colors.sandLight,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    letterSpacing: 0.5,
    overflow: 'hidden',
    flexShrink: 0,
  },
});
