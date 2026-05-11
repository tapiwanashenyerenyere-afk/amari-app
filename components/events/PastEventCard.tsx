import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getEventDateParts } from '@/lib/events';
import { colors, radius, typography } from '@/lib/theme';
import type { Event } from '@/types/database';

interface PastEventCardProps {
  attended?: boolean;
  event: Event;
  onPress?: () => void;
  typeLabel: string;
}

export function PastEventCard({
  attended = false,
  event,
  onPress,
  typeLabel,
}: PastEventCardProps) {
  const { day, month } = getEventDateParts(event.starts_at);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? styles.cardPressed : null,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.type}>{typeLabel}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.venue} numberOfLines={1}>
          {event.venue_name || event.venue_address || 'Venue to be announced'}
        </Text>
        {attended ? <Text style={styles.attended}>ATTENDED</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    marginBottom: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    backgroundColor: colors.cream,
  },
  cardPressed: {
    backgroundColor: colors.warm,
  },
  dateBlock: {
    width: 44,
    alignItems: 'center',
  },
  day: {
    fontFamily: typography.body.bold,
    fontSize: 22,
    lineHeight: 24,
    color: colors.black,
    letterSpacing: -0.5,
  },
  month: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: 'rgba(0,0,0,0.42)',
    letterSpacing: 1.4,
    marginTop: 2,
  },
  info: {
    flex: 1,
  },
  type: {
    fontFamily: typography.mono.medium,
    fontSize: 7,
    color: 'rgba(0,0,0,0.34)',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.black,
    letterSpacing: -0.25,
  },
  venue: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 3,
  },
  attended: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: 'rgba(0,0,0,0.28)',
    letterSpacing: 1,
    marginTop: 6,
  },
});
