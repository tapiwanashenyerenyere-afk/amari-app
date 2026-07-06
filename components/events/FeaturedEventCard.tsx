import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock3, ExternalLink, Heart, Lock, MapPin } from 'lucide-react-native';
import { GrainOverlay } from '@/components/ui/GrainOverlay';
import { getEventDateParts, getEventTimeLabel } from '@/lib/events';
import { colors, radius, typography } from '@/lib/theme';
import type { Event } from '@/types/database';

interface FeaturedEventCardProps {
  actionLabel?: string;
  event: Event;
  gradientColors: [string, string, string];
  locked?: boolean;
  onPress: () => void;
  typeLabel: string;
}

export function FeaturedEventCard({
  actionLabel = 'Open registration',
  event,
  gradientColors,
  locked = false,
  onPress,
  typeLabel,
}: FeaturedEventCardProps) {
  const { day, month, year } = getEventDateParts(event.starts_at);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}. ${locked ? 'View tier requirement.' : `${actionLabel}.`}`}
    >
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
      {event.cover_image_path ? (
        <Image
          source={{ uri: event.cover_image_path }}
          style={styles.coverImage}
        />
      ) : null}
      <View style={styles.imageVeil} pointerEvents="none" />
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />
      <GrainOverlay opacity={0.04} />

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.featuredBadge]}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
          <View style={[styles.badge, styles.typeBadge]}>
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
        </View>

        <View style={styles.dateBlock}>
          <Text style={styles.day}>{day}</Text>
          <View>
            <Text style={styles.month}>{month}</Text>
            <Text style={styles.year}>{year}</Text>
          </View>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.detailList}>
          <View style={styles.detailRow}>
            <MapPin color="rgba(255,255,255,0.42)" size={14} strokeWidth={1.8} />
            <Text style={styles.detailText}>{event.venue_name || 'Venue to be announced'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock3 color="rgba(255,255,255,0.42)" size={14} strokeWidth={1.8} />
            <Text style={styles.detailText}>{getEventTimeLabel(event.starts_at, event.ends_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Heart color="rgba(255,255,255,0.42)" size={14} strokeWidth={1.8} />
            <Text style={styles.detailText}>{event.dress_code || 'Dress code to follow'}</Text>
          </View>
        </View>

        <View style={styles.ctaButton}>
          {locked ? (
            <Lock color={colors.black} size={15} strokeWidth={1.9} />
          ) : (
            <ExternalLink color={colors.black} size={15} strokeWidth={2} />
          )}
          <Text style={styles.ctaLabel}>
            {locked ? 'View tier requirement' : actionLabel}
          </Text>
        </View>
      </View>

      <View style={styles.baseLine} pointerEvents="none" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 320,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.26,
  },
  imageVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  glowTop: {
    position: 'absolute',
    top: -70,
    right: -45,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(201,169,98,0.1)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -40,
    left: -25,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(114,47,55,0.08)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 'auto',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  featuredBadge: {
    backgroundColor: 'rgba(201,169,98,0.1)',
    borderColor: 'rgba(201,169,98,0.16)',
  },
  featuredBadgeText: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    letterSpacing: 1.5,
    color: colors.gold,
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeBadgeText: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.62)',
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 16,
  },
  day: {
    fontFamily: typography.body.bold,
    fontSize: 56,
    lineHeight: 60,
    color: colors.white,
    letterSpacing: -2.2,
  },
  month: {
    fontFamily: typography.mono.medium,
    fontSize: 13,
    color: colors.gold,
    letterSpacing: 2,
  },
  year: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.34)',
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.white,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  detailList: {
    gap: 6,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 17,
  },
  ctaButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaLabel: {
    fontFamily: typography.body.bold,
    fontSize: 14,
    color: colors.black,
    letterSpacing: -0.2,
  },
  baseLine: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(201,169,98,0.18)',
  },
});
