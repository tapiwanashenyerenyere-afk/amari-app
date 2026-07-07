import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AmbientGradient } from '@/components/v2/AmbientGradient';
import { PressableScale } from '@/components/v2/PressableScale';
import { getEventDateParts } from '@/lib/events';
import { colors, radius, spacing, typography } from '@/lib/theme';
import type { Event } from '@/types/database';

interface PulseBridgeTilesProps {
  mapSummary: {
    newThisWeek: number;
    total: number;
  };
  nextEvent: Event | null;
  onOpenEvents: () => void;
  onOpenMap: () => void;
}

function BridgeTile({
  children,
  gradientColors,
  glow,
  onPress,
}: {
  children: React.ReactNode;
  gradientColors: [string, string, string];
  glow?: string;
  onPress: () => void;
}) {
  return (
    <PressableScale haptic={false} onPress={onPress} style={styles.tile}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
      <AmbientGradient color={glow} size={170} />
      <View style={styles.grain} />
      <View style={styles.inner}>{children}</View>
    </PressableScale>
  );
}

export function PulseBridgeTiles({
  mapSummary,
  nextEvent,
  onOpenEvents,
  onOpenMap,
}: PulseBridgeTilesProps) {
  const nextEventDate = nextEvent ? getEventDateParts(nextEvent.starts_at) : null;

  return (
    <View style={styles.row}>
      <BridgeTile gradientColors={['#1A1510', '#0F0A06', '#1C1510']} glow="196,162,101" onPress={onOpenEvents}>
        <Text style={styles.label}>Next event</Text>
        {nextEventDate ? (
          <>
            <View style={styles.dateWrap}>
              <Text style={styles.dateDay}>{nextEventDate.day}</Text>
              <Text style={styles.dateMonth}>{nextEventDate.month}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {nextEvent?.title || 'Upcoming event'}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {nextEvent?.dress_code || 'Details to follow'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Events calendar warming up</Text>
            <Text style={styles.meta}>New rooms will appear here once they are announced.</Text>
          </>
        )}
      </BridgeTile>

      <BridgeTile gradientColors={['#101820', '#0A1018', '#141C24']} glow="140,170,210" onPress={onOpenMap}>
        <Text style={styles.label}>On the map</Text>
        <View style={styles.countWrap}>
          <Text style={styles.count}>{mapSummary.total}</Text>
          <Text style={styles.countLabel}>projects live</Text>
        </View>
        <Text style={styles.mapMeta}>
          {mapSummary.newThisWeek > 0 ? `${mapSummary.newThisWeek} new this week →` : 'Open Aligned map →'}
        </Text>
      </BridgeTile>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.xl,
    marginTop: 14,
    marginBottom: 20,
  },
  tile: {
    flex: 1,
    minHeight: 130,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  inner: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontFamily: typography.mono.medium,
    fontSize: 7,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    marginBottom: 'auto',
    textTransform: 'uppercase',
  },
  dateWrap: {
    marginBottom: 8,
  },
  dateDay: {
    fontFamily: typography.body.bold,
    fontSize: 28,
    lineHeight: 28,
    color: colors.white,
  },
  dateMonth: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 15,
    lineHeight: 19,
    color: colors.white,
    marginBottom: 4,
  },
  meta: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.52)',
    lineHeight: 16,
  },
  countWrap: {
    marginBottom: 8,
  },
  count: {
    fontFamily: typography.body.bold,
    fontSize: 22,
    lineHeight: 24,
    color: colors.white,
  },
  countLabel: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  mapMeta: {
    fontFamily: typography.body.semiBold,
    fontSize: 11,
    color: colors.gold,
  },
});
