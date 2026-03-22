import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useEventDetail, useEvents, useRsvpToEvent } from '../../queries/events';
import { colors, typography, spacing, radius } from '../../lib/theme';
import {
  WhiteCard,
  EventRow,
  FilterPills,
  StaggerReveal,
} from '../../components/v2';
import { EventDetailSheet } from '../../components/EventDetailSheet';

const GALA_URL = 'https://www.eventbrite.com.au/e/amari-gala-2026-tickets-1981656906151';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const { data: events } = useEvents('upcoming');
  const { data: selectedEventDetail } = useEventDetail(selectedEventId ?? 0);
  const rsvpToEvent = useRsvpToEvent();

  const eventsList = useMemo(() => events ?? [], [events]);
  const filteredEvents = useMemo(() => {
    if (filter === 'All') {
      return eventsList;
    }

    if (filter === 'Dinners') {
      return eventsList.filter((event: any) => event.type === 'dinner');
    }

    if (filter === 'Talks') {
      return eventsList.filter((event: any) => event.type === 'talk');
    }

    return eventsList;
  }, [eventsList, filter]);
  const selectedEvent =
    (selectedEventDetail ?? eventsList.find((event: any) => event.id === selectedEventId)) || null;

  const handleRsvp = () => {
    if (!selectedEventId) {
      return;
    }

    rsvpToEvent.mutate(selectedEventId, {
      onSuccess: () => setSelectedEventId(null),
      onError: (error: Error) => Alert.alert('Could not RSVP', error.message),
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaggerReveal>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Events</Text>
            <Text style={styles.count}>{filteredEvents.length} upcoming</Text>
          </View>

          {/* Filter pills */}
          <FilterPills
            options={['All', 'Dinners', 'Talks']}
            selected={filter}
            onSelect={setFilter}
          />

          {/* Featured Event */}
          <WhiteCard onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(GALA_URL);
          }}>
            <View style={styles.featuredInner}>
              <Text style={styles.featuredLabel}>FEATURED</Text>
              <Text style={styles.featuredTitle}>AMARI Gala 2026</Text>
              <Text style={styles.featuredMeta}>
                May 2 · Plaza Ballroom, 191 Collins St · Black Tie
              </Text>
              <Pressable
                style={styles.viewDetailsBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(GALA_URL);
                }}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </Pressable>
            </View>
          </WhiteCard>

          {/* Event list */}
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event: any, i: number) => {
              const date = event.starts_at ? new Date(event.starts_at) : null;
              return (
                <EventRow
                  key={event.id || i}
                  day={date ? date.getDate().toString().padStart(2, '0') : '--'}
                  month={date ? date.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBA'}
                  title={event.title}
                  meta={[event.venue_name, event.type].filter(Boolean).join(' · ')}
                  tier={event.min_tier?.toUpperCase().slice(0, 4)}
                  dimDate={i > 0}
                  onPress={() => setSelectedEventId(event.id)}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No additional events right now.</Text>
              <Text style={styles.emptyHint}>New events will appear here as they're announced.</Text>
            </View>
          )}
        </StaggerReveal>
      </ScrollView>

      <EventDetailSheet
        visible={selectedEventId !== null && !!selectedEvent}
        onClose={() => setSelectedEventId(null)}
        onRsvp={handleRsvp}
        event={
          selectedEvent && selectedEvent.starts_at
            ? {
                id: selectedEvent.id,
                title: selectedEvent.title,
                description: selectedEvent.description || undefined,
                starts_at: selectedEvent.starts_at,
                venue_name: selectedEvent.venue_name || undefined,
                capacity: selectedEvent.capacity ?? undefined,
                rsvp_count: Array.isArray(selectedEvent.event_rsvps)
                  ? selectedEvent.event_rsvps[0]?.count ?? 0
                  : undefined,
                type: selectedEvent.type || undefined,
                min_tier: selectedEvent.min_tier || undefined,
              }
            : null
        }
        isRsvping={rsvpToEvent.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 88 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  title: { fontFamily: typography.serif.medium, fontSize: 26, fontWeight: '500', color: colors.black, letterSpacing: -0.3 },
  count: { fontFamily: typography.mono.regular, fontSize: 9, color: '#bbb' },
  featuredInner: { backgroundColor: colors.black, borderRadius: radius.md, padding: 20, },
  featuredLabel: { fontFamily: typography.mono.regular, fontSize: 9, color: colors.sand, letterSpacing: 2, marginBottom: 8 },
  featuredTitle: { fontFamily: typography.serif.medium, fontSize: 22, fontWeight: '500', color: colors.white, marginBottom: 4, letterSpacing: -0.3 },
  featuredMeta: { fontFamily: typography.body.regular, fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  viewDetailsBtn: { marginTop: 12, alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  viewDetailsText: { fontFamily: typography.body.medium, fontSize: 12, fontWeight: '500', color: colors.white },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontFamily: typography.body.regular, fontSize: 13, color: colors.gray },
  emptyHint: { fontFamily: typography.body.regular, fontSize: 11, color: colors.grayLight, marginTop: 4 },
});
