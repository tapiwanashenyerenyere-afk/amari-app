import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEvents } from '../../queries/events';
import { colors, typography, spacing, radius } from '../../lib/theme';
import {
  WhiteCard,
  EventRow,
  FilterPills,
  AvatarStack,
  StaggerReveal,
} from '../../components/v2';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const { data: events } = useEvents('upcoming');

  const eventsList = events || [];

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
            <Text style={styles.count}>{eventsList.length || 4} upcoming</Text>
          </View>

          {/* Filter pills */}
          <FilterPills
            options={['All', 'Dinners', 'Talks']}
            selected={filter}
            onSelect={setFilter}
          />

          {/* Featured Event */}
          <WhiteCard onPress={() => {}}>
            <View style={styles.featuredInner}>
              <Text style={styles.featuredLabel}>FEATURED</Text>
              <Text style={styles.featuredTitle}>Annual Gala 2026</Text>
              <Text style={styles.featuredMeta}>
                April 19 · Crown Palladium · Black Tie
              </Text>
              <Pressable style={styles.viewDetailsBtn}>
                <Text style={styles.viewDetailsText}>View Details</Text>
              </Pressable>
            </View>
          </WhiteCard>

          {/* Event list */}
          {eventsList.length > 0 ? (
            eventsList.map((event: any, i: number) => {
              const date = new Date(event.event_date || event.date);
              return (
                <EventRow
                  key={event.id || i}
                  day={date.getDate().toString().padStart(2, '0')}
                  month={date.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                  title={event.title}
                  meta={[event.location, event.type].filter(Boolean).join(' · ')}
                  tier={event.min_tier?.toUpperCase().slice(0, 4)}
                  dimDate={i > 0}
                  onPress={() => {}}
                />
              );
            })
          ) : (
            <>
              <EventRow day="28" month="MAR" title="Founders' Dinner" meta="The Langham · Dinner · 24 seats" tier="PLAT" onPress={() => {}} />
              <EventRow day="05" month="APR" title="Innovation Talk" meta="AMARI House · Talk" dimDate onPress={() => {}} />
              <EventRow day="26" month="APR" title="Melbourne Mixer" meta="Arbory Afloat · Social" dimDate onPress={() => {}} />
            </>
          )}
        </StaggerReveal>
      </ScrollView>
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
});
