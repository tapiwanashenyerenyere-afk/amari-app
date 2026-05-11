import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, Heart, Lock, MapPin } from 'lucide-react-native';
import { GrainOverlay } from '@/components/ui/GrainOverlay';
import { getEventDateParts, getTierRequirementLabel } from '@/lib/events';
import { colors, radius, typography } from '@/lib/theme';
import type { Event } from '@/types/database';

interface EventCardProps {
  actionLabel: string;
  event: Event;
  gradientColors: [string, string, string];
  locked?: boolean;
  onPress: () => void;
  typeLabel: string;
}

export function EventCard({
  actionLabel,
  event,
  gradientColors,
  locked = false,
  onPress,
  typeLabel,
}: EventCardProps) {
  const { day, month } = getEventDateParts(event.starts_at);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}. ${locked ? `Requires ${getTierRequirementLabel(event.min_tier)} membership.` : actionLabel}.`}
    >
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
      <GrainOverlay opacity={0.04} />

      <View style={styles.content}>
        <View style={styles.dateBlock}>
          <Text style={styles.day}>{day}</Text>
          <Text style={styles.month}>{month}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.type}>{typeLabel}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.metaStack}>
            <View style={styles.metaRow}>
              <MapPin color="rgba(255,255,255,0.34)" size={12} strokeWidth={1.8} />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.venue_name || 'Venue to be announced'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Heart color="rgba(255,255,255,0.34)" size={12} strokeWidth={1.8} />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.dress_code || 'Dress code to follow'}
              </Text>
            </View>
          </View>

          {event.min_tier !== 'member' ? (
            <View style={styles.tierRow}>
              <Lock color={colors.gold} size={10} strokeWidth={2} />
              <Text style={styles.tierText}>{getTierRequirementLabel(event.min_tier)} only</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.actionButton, locked ? styles.actionButtonLocked : null]}>
          {locked ? (
            <Lock color={colors.black} size={12} strokeWidth={2} />
          ) : (
            <ExternalLink color={colors.black} size={12} strokeWidth={2} />
          )}
          <Text style={styles.actionText}>{actionLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  dateBlock: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    fontFamily: typography.body.bold,
    fontSize: 32,
    lineHeight: 34,
    color: colors.white,
    letterSpacing: -1,
  },
  month: {
    fontFamily: typography.mono.medium,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.8,
    marginTop: 2,
  },
  info: {
    flex: 1,
  },
  type: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: 'rgba(255,255,255,0.52)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 17,
    lineHeight: 21,
    color: colors.white,
    letterSpacing: -0.35,
    marginBottom: 6,
  },
  metaStack: {
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },
  tierText: {
    fontFamily: typography.mono.medium,
    fontSize: 7,
    color: 'rgba(196,162,101,0.88)',
    letterSpacing: 0.9,
  },
  actionButton: {
    minWidth: 84,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  actionButtonLocked: {
    backgroundColor: '#F3E4C8',
  },
  actionText: {
    fontFamily: typography.body.bold,
    fontSize: 11,
    color: colors.black,
    letterSpacing: -0.1,
  },
});
