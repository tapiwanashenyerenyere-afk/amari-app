import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { EventCard } from '../../components/events/EventCard';
import { FeaturedEventCard } from '../../components/events/FeaturedEventCard';
import { PastEventCard } from '../../components/events/PastEventCard';
import { TicketModal } from '../../components/events/TicketModal';
import {
  EVENT_FILTER_OPTIONS,
  EVENT_TIER_COPY,
  EVENT_TYPE_GRADIENTS,
  getEventRegistrationUrl,
  getEventTypeLabel,
  getTierRequirementLabel,
  matchesEventFilter,
  type EventFilter,
} from '../../lib/events';
import { colors, typography, spacing, radius, TIER_LEVELS } from '../../lib/theme';
import { useAuth } from '../../providers/AuthProvider';
import { useMyProfile } from '../../queries/members';
import { useCancelRsvp, useEvents, useMyRsvps, useRsvpToEvent } from '../../queries/events';
import { FilterPills } from '../../components/v2';
import type { Event, MembershipTier, RsvpStatus } from '../../types/database';

function hasTierAccess(userTier: MembershipTier, minTier: MembershipTier) {
  return TIER_LEVELS[userTier] >= TIER_LEVELS[minTier];
}

function TierRequirementSheet({
  event,
  onClose,
}: {
  event: Event | null;
  onClose: () => void;
}) {
  if (!event) {
    return null;
  }

  const tierLabel = getTierRequirementLabel(event.min_tier);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <Pressable onPress={onClose} style={styles.sheetBackdrop}>
        <View />
      </Pressable>

      <View style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetBadge}>
            <Lock color={colors.gold} size={14} strokeWidth={1.9} />
            <Text style={styles.sheetBadgeText}>{tierLabel}</Text>
          </View>

          <Text style={styles.sheetTitle}>This event requires {tierLabel} membership</Text>
          <Text style={styles.sheetEventTitle}>{event.title}</Text>
          <Text style={styles.sheetBody}>{EVENT_TIER_COPY[event.min_tier]}</Text>
          <Text style={styles.sheetFootnote}>
            AMARI shows the room to everyone, but registration opens when your membership tier reaches the required level.
          </Text>

          <Pressable onPress={onClose} style={styles.sheetButton}>
            <Text style={styles.sheetButtonText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { tier } = useAuth();
  const [filter, setFilter] = useState<EventFilter>('all');
  const [lockedEvent, setLockedEvent] = useState<Event | null>(null);
  const [ticketEvent, setTicketEvent] = useState<Event | null>(null);
  const [freshTicketStatus, setFreshTicketStatus] = useState<RsvpStatus | null>(null);
  const { data: upcomingData } = useEvents({ scope: 'upcoming' });
  const { data: pastData } = useEvents({ scope: 'past' });
  const { data: myRsvps } = useMyRsvps();
  const { data: profile } = useMyProfile();
  const rsvpToEvent = useRsvpToEvent();
  const cancelRsvp = useCancelRsvp();

  const upcomingEvents = useMemo(
    () => (upcomingData ?? []).filter((event) => matchesEventFilter(event, filter)),
    [filter, upcomingData],
  );

  const pastEvents = useMemo(
    () => (pastData ?? []).filter((event) => matchesEventFilter(event, filter)),
    [filter, pastData],
  );

  const featuredEvent = useMemo(
    () => upcomingEvents.find((event) => event.is_featured) ?? upcomingEvents[0] ?? null,
    [upcomingEvents],
  );

  const listEvents = useMemo(
    () => upcomingEvents.filter((event) => event.id !== featuredEvent?.id),
    [featuredEvent, upcomingEvents],
  );

  const attendedEventIds = useMemo(
    () =>
      new Set<number>(
        (myRsvps ?? [])
          .filter((rsvp: any) => rsvp.status === 'confirmed')
          .map((rsvp: any) => rsvp.event_id),
      ),
    [myRsvps],
  );

  const ticketStatusByEventId = useMemo(() => {
    const map = new Map<number, RsvpStatus>();
    (myRsvps ?? []).forEach((rsvp: any) => {
      if (rsvp.status === 'confirmed' || rsvp.status === 'waitlisted') {
        map.set(rsvp.event_id, rsvp.status);
      }
    });
    return map;
  }, [myRsvps]);

  const selectedFilterLabel = useMemo(
    () => EVENT_FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? 'All',
    [filter],
  );

  const handleRegister = async (event: Event) => {
    if (!hasTierAccess(tier, event.min_tier)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setLockedEvent(event);
      return;
    }

    if (ticketStatusByEventId.has(event.id)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFreshTicketStatus(null);
      setTicketEvent(event);
      return;
    }

    const registrationUrl = getEventRegistrationUrl(event);
    if (registrationUrl) {
      const canOpen = await Linking.canOpenURL(registrationUrl);
      if (!canOpen) {
        Alert.alert('Invalid link', 'This registration link could not be opened.');
        return;
      }

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await Linking.openURL(registrationUrl);
      } catch {
        Alert.alert('Registration unavailable', 'This registration link could not be opened right now.');
      }
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = (await rsvpToEvent.mutateAsync(event.id)) as {
        success: boolean;
        status?: string;
        error?: string;
      };

      if (!result?.success) {
        Alert.alert('Ticket unavailable', result?.error ?? 'This event could not be booked right now.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFreshTicketStatus(result.status === 'waitlisted' ? 'waitlisted' : 'confirmed');
      setTicketEvent(event);
    } catch {
      Alert.alert('Ticket unavailable', 'This event could not be booked right now.');
    }
  };

  const handleCancelTicket = async (event: Event) => {
    try {
      const result = await cancelRsvp.mutateAsync(event.id);
      if (!result?.success) {
        Alert.alert('Could not cancel', result?.error ?? 'This ticket could not be cancelled.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTicketEvent(null);
    } catch {
      Alert.alert('Could not cancel', 'This ticket could not be cancelled right now.');
    }
  };

  const getActionLabel = (event: Event) => {
    if (!hasTierAccess(tier, event.min_tier)) {
      return 'Locked';
    }
    const ticketStatus = ticketStatusByEventId.get(event.id);
    if (ticketStatus) {
      return ticketStatus === 'waitlisted' ? 'Waitlist' : 'Ticket';
    }
    return getEventRegistrationUrl(event) ? 'Register' : 'Get Ticket';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Events</Text>
          <Text style={styles.count}>{upcomingEvents.length} upcoming</Text>
        </View>

        <FilterPills
          options={EVENT_FILTER_OPTIONS.map((option) => option.label)}
          selected={selectedFilterLabel}
          onSelect={(label) => {
            const nextFilter = EVENT_FILTER_OPTIONS.find((option) => option.label === label)?.value ?? 'all';
            setFilter(nextFilter);
          }}
        />

        {featuredEvent ? (
          <FeaturedEventCard
            actionLabel={
              ticketStatusByEventId.has(featuredEvent.id)
                ? 'View your ticket'
                : getEventRegistrationUrl(featuredEvent)
                  ? 'Open registration'
                  : 'Get your ticket'
            }
            event={featuredEvent}
            gradientColors={EVENT_TYPE_GRADIENTS[featuredEvent.type]}
            locked={!hasTierAccess(tier, featuredEvent.min_tier)}
            onPress={() => handleRegister(featuredEvent)}
            typeLabel={getEventTypeLabel(featuredEvent.type)}
          />
        ) : (
          <View style={styles.emptyHero}>
            <Text style={styles.emptyHeroTitle}>Nothing upcoming in this filter yet.</Text>
            <Text style={styles.emptyHeroText}>
              New AMARI events will appear here as they are announced.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>UPCOMING</Text>
          {listEvents.length ? (
            listEvents.map((event) => (
              <EventCard
                actionLabel={getActionLabel(event)}
                event={event}
                gradientColors={EVENT_TYPE_GRADIENTS[event.type]}
                key={event.id}
                locked={!hasTierAccess(tier, event.min_tier)}
                onPress={() => handleRegister(event)}
                typeLabel={getEventTypeLabel(event.type)}
              />
            ))
          ) : (
            <Text style={styles.sectionHint}>
              {featuredEvent
                ? 'The featured card is the only upcoming event in this category right now.'
                : 'No upcoming events match this filter yet.'}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAST</Text>
          {pastEvents.length ? (
            pastEvents.map((event) => (
              <PastEventCard
                attended={attendedEventIds.has(event.id)}
                event={event}
                key={event.id}
                typeLabel={getEventTypeLabel(event.type)}
              />
            ))
          ) : (
            <Text style={styles.sectionHint}>Past events will collect here as the calendar builds out.</Text>
          )}
        </View>
      </ScrollView>

      <TierRequirementSheet event={lockedEvent} onClose={() => setLockedEvent(null)} />

      <TicketModal
        cancelling={cancelRsvp.isPending}
        displayId={profile?.display_id || ''}
        event={ticketEvent}
        memberName={profile?.full_name?.trim() || 'AMARI Member'}
        onCancel={handleCancelTicket}
        onClose={() => setTicketEvent(null)}
        rsvpStatus={
          ticketEvent
            ? ticketStatusByEventId.get(ticketEvent.id) ?? freshTicketStatus ?? 'confirmed'
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 116 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 26,
    color: colors.black,
    letterSpacing: -0.5,
  },
  count: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    color: colors.gold,
  },
  emptyHero: {
    minHeight: 220,
    borderRadius: radius.xl,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginTop: 8,
  },
  emptyHeroTitle: {
    fontFamily: typography.body.bold,
    fontSize: 19,
    lineHeight: 24,
    color: colors.black,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyHeroText: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginTop: 22,
  },
  sectionLabel: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: 'rgba(0,0,0,0.42)',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionHint: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
    paddingVertical: 8,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(10,10,10,0.12)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(196,162,101,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196,162,101,0.16)',
  },
  sheetBadgeText: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: colors.goldDark,
    letterSpacing: 1.4,
  },
  sheetTitle: {
    fontFamily: typography.body.bold,
    fontSize: 22,
    lineHeight: 27,
    color: colors.black,
    letterSpacing: -0.45,
    marginTop: 16,
  },
  sheetEventTitle: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.black,
    marginTop: 8,
  },
  sheetBody: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.gray,
    marginTop: 12,
  },
  sheetFootnote: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
    marginTop: 10,
  },
  sheetButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  sheetButtonText: {
    fontFamily: typography.body.bold,
    fontSize: 14,
    color: colors.white,
  },
});
