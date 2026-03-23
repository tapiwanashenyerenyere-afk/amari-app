import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getEditorialStories } from '../../data/editorialStories';
import { getRecommendedEditorialLead, rankEditorialStories } from '../../lib/editorialRecommendations';
import { useEventDetail, useEvents, useRsvpToEvent } from '../../queries/events';
import { useMyProfile } from '../../queries/members';
import { useAlignedConnections } from '../../queries/aligned';
import { useCorridorOpportunities } from '../../hooks/useCorridorInterest';
import { colors, typography, spacing, radius } from '../../lib/theme';
import {
  WhiteCard,
  SectionLabel,
  EventRow,
  ProgressBar,
  StaggerReveal,
} from '../../components/v2';
import { BreathingDot } from '../../components/v2/BreathingDot';
import { ExploreCarousel, QuickActions } from '../../components/pulse';
import { useExploreFeed } from '../../hooks/useExploreFeed';
import { EventDetailSheet } from '../../components/EventDetailSheet';
import type { ExploreTile } from '../../types/explore';

const GALA_URL = 'https://www.eventbrite.com.au/e/amari-gala-2026-tickets-1981656906151';

function parseTileId(id: string, prefix: string) {
  if (!id.startsWith(prefix)) {
    return null;
  }

  const value = Number(id.slice(prefix.length));
  return Number.isFinite(value) ? value : null;
}

function formatEditorialDate(value: string) {
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const { data: profile } = useMyProfile();
  const { data: events } = useEvents('upcoming');
  const { data: selectedEventDetail } = useEventDetail(selectedEventId ?? 0);
  const rsvpToEvent = useRsvpToEvent();
  const { data: alignedConnections = [] } = useAlignedConnections(12);
  const { data: corridorOpportunities = [] } = useCorridorOpportunities();
  const explore = useExploreFeed();
  const editorialRankings = useMemo(
    () => rankEditorialStories(profile || null, getEditorialStories()),
    [profile],
  );
  const featuredStory = editorialRankings[0]?.story ?? getRecommendedEditorialLead(profile || null)?.story ?? null;
  const featuredStoryReason = editorialRankings[0]?.reason ?? null;
  const pulseArchive = editorialRankings
    .slice(1, 4)
    .map((item) => item.story);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    let filled = 0;
    const fields = ['full_name', 'bio', 'company', 'industry', 'city'];
    fields.forEach((f) => {
      if (profile[f as keyof typeof profile]) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const upcomingEvents = events?.slice(0, 3) || [];
  const selectedEvent =
    (selectedEventDetail ?? upcomingEvents.find((event: any) => event.id === selectedEventId)) || null;

  const handleExploreTilePress = (tile: ExploreTile) => {
    if (tile.type === 'editorial') {
      const pulseId = parseTileId(tile.id, 'pulse-');
      if (pulseId != null) {
        router.push({ pathname: '/pulse/[id]', params: { id: String(pulseId) } });
      } else if (tile.id.startsWith('pulse-')) {
        router.push({ pathname: '/pulse/[id]', params: { id: tile.id.slice('pulse-'.length) } });
      }
      return;
    }

    if (tile.type === 'event_preview') {
      const eventId = parseTileId(tile.id, 'event-');
      if (eventId != null) {
        setSelectedEventId(eventId);
      } else {
        router.push('/(tabs)/events');
      }
      return;
    }

    if (tile.type === 'member_project') {
      router.push('/(tabs)/aligned/projects');
      return;
    }

    if (tile.type === 'member_interest') {
      router.push('/(tabs)/aligned/interests');
      return;
    }
  };

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
          {/* Greeting + Explore */}
          <View>
            <Text style={styles.timeLabel}>{getGreeting()}</Text>
            <Text style={styles.exploreTitle} accessibilityRole="header">Explore</Text>
          </View>
        </StaggerReveal>

        {/* Explore Carousel — outside StaggerReveal for full-bleed scroll */}
        <ExploreCarousel
          tiles={explore.tiles}
          isLoading={explore.isLoading}
          onTilePress={handleExploreTilePress}
        />
        {!explore.isLoading && explore.tiles.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <WhiteCard static>
              <Text style={styles.emptyText}>
                The next curated drop is being assembled. New introductions and invitations will land here first.
              </Text>
            </WhiteCard>
          </View>
        ) : null}

        <StaggerReveal>
          {/* Quick Actions */}
          <View style={{ paddingHorizontal: spacing.xl, marginTop: 20 }}>
            <QuickActions
              matchCount={alignedConnections.length}
              opportunityCount={corridorOpportunities.length}
              eventCount={upcomingEvents.length}
            />
          </View>

          {/* Divider */}
          <View style={styles.rule} />

          {/* The Pulse — Editorial Hero */}
          <View style={styles.sectionHeaderRow}>
            <SectionLabel>The Pulse</SectionLabel>
            <Pressable
              onPress={() => router.push('/pulse' as any)}
              accessibilityRole="button"
              accessibilityLabel="Browse all Pulse stories"
            >
              <Text style={styles.sectionLink}>Archive →</Text>
            </Pressable>
          </View>
          {featuredStory ? (
            <>
              <Pressable
                style={styles.editorialLeadCard}
                onPress={() => router.push({ pathname: '/pulse/[id]', params: { id: featuredStory.slug } })}
                accessibilityRole="button"
                accessibilityLabel={`Open Pulse story: ${featuredStory.headline}`}
              >
                {featuredStory.image ? (
                  <Image source={featuredStory.image} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={300} />
                ) : (
                  <LinearGradient
                    colors={['#1C1815', '#111111', '#14120F']}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <LinearGradient
                  colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
                  locations={[0, 0.5, 1]}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.editorialLeadContent}>
                  <View style={styles.pulseIndicator}>
                    <BreathingDot size={5} />
                    <Text style={styles.pulseLabel}>RECOMMENDED FOR YOU</Text>
                  </View>
                  <Text style={styles.editorialLeadCategory}>{featuredStory.category}</Text>
                  <Text style={styles.pulseHeadline}>{featuredStory.headline}</Text>
                  <Text style={styles.pulseDesc}>{featuredStory.summary}</Text>
                  {featuredStoryReason ? (
                    <Text style={styles.editorialReason}>{featuredStoryReason}</Text>
                  ) : null}
                  {featuredStory.amariConnection ? (
                    <Text style={styles.editorialConnection}>{featuredStory.amariConnection}</Text>
                  ) : null}
                  <View style={styles.pulseFooter}>
                    <Text style={styles.pulseRead}>{formatEditorialDate(featuredStory.publishedAt)}</Text>
                    <Text style={styles.pulseLink}>Read →</Text>
                  </View>
                </View>
              </Pressable>

              <WhiteCard static>
                {pulseArchive.map((story, index) => (
                  <Pressable
                    key={story.id}
                    style={[styles.archiveRow, index === pulseArchive.length - 1 && styles.archiveRowLast]}
                    onPress={() => router.push({ pathname: '/pulse/[id]', params: { id: story.slug } })}
                    accessibilityRole="button"
                    accessibilityLabel={`Open Pulse story: ${story.headline}`}
                  >
                    <View style={styles.archiveMeta}>
                      <Text style={styles.archiveCategory}>{story.shortLabel}</Text>
                      <Text style={styles.archiveHeadline}>{story.headline}</Text>
                      <Text style={styles.archiveDate}>{formatEditorialDate(story.publishedAt)}</Text>
                    </View>
                    <Text style={styles.archiveLink}>Open</Text>
                  </Pressable>
                ))}
              </WhiteCard>
            </>
          ) : (
            <WhiteCard static>
              <Text style={styles.emptyText}>
                The Pulse archive is being prepared. Check back after the next AMARI release.
              </Text>
            </WhiteCard>
          )}

          {/* Upcoming Events */}
          <SectionLabel>Upcoming</SectionLabel>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event: any, i: number) => {
              const date = new Date(event.starts_at);
              return (
                <EventRow
                  key={event.id || i}
                  day={date.getDate().toString().padStart(2, '0')}
                  month={date.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                  title={event.title}
                  meta={[event.venue_name, event.type].filter(Boolean).join(' · ')}
                  tier={event.min_tier?.toUpperCase().slice(0, 4)}
                  dimDate={i > 0}
                  onPress={() => setSelectedEventId(event.id)}
                />
              );
            })
          ) : (
            <WhiteCard static>
              <Text style={styles.emptyText}>
                No event dates are live yet. When the next invitation window opens, it will appear here first.
              </Text>
            </WhiteCard>
          )}

          {/* Featured Event — Dark card inside white card */}
          <WhiteCard onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(GALA_URL);
          }}>
            <View style={styles.featuredInner}>
              <Text style={styles.featuredLabel}>FEATURED</Text>
              <Text style={styles.featuredTitle}>AMARI Gala 2026</Text>
              <Text style={styles.featuredMeta}>May 2 · Plaza Ballroom, 191 Collins St · Black Tie</Text>
              <View style={styles.featuredFooter}>
                <Text style={styles.featuredLink}>Details →</Text>
              </View>
            </View>
          </WhiteCard>

          {/* Profile Completion */}
          <SectionLabel>Profile</SectionLabel>
          <WhiteCard
            static
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/profile');
            }}
          >
            <View style={styles.profileNudge}>
              <View style={styles.profileHeader}>
                <Text style={styles.profilePercent}>{profileCompletion}% complete</Text>
                <Text style={styles.profileEdit}>Edit →</Text>
              </View>
              <ProgressBar progress={profileCompletion} />
              <Text style={styles.profileHint}>Complete your profile to get more from Aligned.</Text>
            </View>
          </WhiteCard>
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
  date: { fontFamily: typography.mono.regular, fontSize: 11, color: colors.sand, letterSpacing: 1.5, marginBottom: 3 },
  timeLabel: { fontFamily: typography.body.regular, fontSize: 12, color: colors.sand, marginBottom: 4 },
  exploreTitle: { fontFamily: typography.serif.medium, fontSize: 30, color: colors.black, letterSpacing: -0.3, marginBottom: 16 },
  greeting: { fontFamily: typography.serif.medium, fontSize: 26, fontWeight: '500', color: colors.black, lineHeight: 30, letterSpacing: -0.3 },
  rule: { height: 1, backgroundColor: colors.rule, marginVertical: 14 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLink: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.sand,
  },
  editorialLeadCard: {
    minHeight: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 10,
  },
  editorialLeadContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  pulseIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  pulseDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.sand },
  pulseLabel: { fontFamily: typography.mono.regular, fontSize: 10, color: colors.sandOnDark, letterSpacing: 1.5 },
  editorialLeadCategory: {
    fontFamily: typography.geo.semiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  pulseHeadline: { fontFamily: typography.serif.medium, fontSize: 21, fontWeight: '500', color: colors.white, lineHeight: 26, marginBottom: 8, letterSpacing: -0.3 },
  pulseDesc: { fontFamily: typography.body.regular, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 19, marginBottom: 12 },
  editorialReason: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.76)',
    marginBottom: 10,
  },
  editorialConnection: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.sandOnDark,
    marginBottom: 10,
  },
  pulseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pulseRead: { fontFamily: typography.mono.regular, fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  pulseLink: { fontFamily: typography.body.medium, fontSize: 12, fontWeight: '500', color: colors.sandOnDark },
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  archiveRowLast: {
    borderBottomWidth: 0,
  },
  archiveMeta: {
    flex: 1,
  },
  archiveCategory: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 1.3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  archiveHeadline: {
    fontFamily: typography.geo.semiBold,
    fontSize: 14,
    color: colors.black,
    lineHeight: 19,
    marginBottom: 4,
  },
  archiveDate: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
  },
  archiveLink: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.sand,
  },
  featuredInner: { backgroundColor: colors.black, borderRadius: radius.md, padding: 18 },
  featuredLabel: { fontFamily: typography.mono.regular, fontSize: 10, color: colors.sandOnDark, letterSpacing: 2, marginBottom: 8 },
  featuredTitle: { fontFamily: typography.serif.medium, fontSize: 19, fontWeight: '500', color: colors.white, marginBottom: 4, letterSpacing: -0.3 },
  featuredMeta: { fontFamily: typography.body.regular, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  featuredLink: { fontFamily: typography.body.medium, fontSize: 11, fontWeight: '500', color: colors.sandOnDark },
  profileNudge: { padding: 14, paddingHorizontal: 16 },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  profilePercent: { fontFamily: typography.body.medium, fontSize: 12, fontWeight: '500', color: colors.black },
  profileEdit: { fontFamily: typography.body.medium, fontSize: 11, fontWeight: '500', color: colors.sand },
  profileHint: { fontFamily: typography.body.regular, fontSize: 11, fontStyle: 'italic', color: colors.gray, marginTop: 6 },
  emptyText: { fontFamily: typography.body.regular, fontSize: 13, color: colors.gray, textAlign: 'center', paddingVertical: 16 },
});
