import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLatestPulse } from '../../queries/pulse';
import { useEvents } from '../../queries/events';
import { useMyProfile } from '../../queries/members';
import { useAlignedConnections } from '../../queries/aligned';
import { useCorridorOpportunities } from '../../hooks/useCorridorInterest';
import { colors, typography, spacing, radius } from '../../lib/theme';
import {
  WhiteCard,
  HeroCard,
  SectionLabel,
  EventRow,
  ProgressBar,
  AvatarStack,
  StaggerReveal,
} from '../../components/v2';
import { BreathingDot } from '../../components/v2/BreathingDot';
import { ExploreCarousel, QuickActions } from '../../components/pulse';
import { useExploreFeed } from '../../hooks/useExploreFeed';

const GALA_URL = 'https://www.eventbrite.com.au/e/amari-gala-2026-tickets-1981656906151';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile } = useMyProfile();
  const { data: pulse } = useLatestPulse();
  const { data: events } = useEvents('upcoming');
  const { data: alignedConnections = [] } = useAlignedConnections(12);
  const { data: corridorOpportunities = [] } = useCorridorOpportunities();
  const explore = useExploreFeed();

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
        <ExploreCarousel tiles={explore.tiles} isLoading={explore.isLoading} />

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
          <SectionLabel>The Pulse</SectionLabel>
          <HeroCard onPress={() => {}}>
            <View style={styles.pulseIndicator}>
              <BreathingDot size={5} />
              <Text style={styles.pulseLabel}>NEW THIS WEEK</Text>
            </View>
            <Text style={styles.pulseHeadline}>
              {pulse?.headline || 'What It Means to\nBe an Alchemist'}
            </Text>
            <Text style={styles.pulseDesc}>
              {(typeof pulse?.summary_content === 'object' && pulse?.summary_content !== null
                ? ((pulse.summary_content as any).blocks || []).map((b: any) => b.content).join(' ')
                : pulse?.summary_content) || 'AMARI exists for the people who refuse to wait for permission. Not the loudest in the room — the ones who change what the room looks like. We call them alchemists. Founders who build before the market believes. Operators who turn disorder into systems. The ones who define what comes next, not what came before.'}
            </Text>
            <View style={styles.pulseFooter}>
              <Text style={styles.pulseRead}>3 min read</Text>
              <Text style={styles.pulseLink}>Read →</Text>
            </View>
          </HeroCard>

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
                  onPress={() => {}}
                />
              );
            })
          ) : (
            <WhiteCard static>
              <Text style={styles.emptyText}>No upcoming events yet. Stay tuned.</Text>
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
                <AvatarStack initials={['A', 'K', 'N']} extra={12} />
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
              <Text style={styles.profileHint}>Complete your profile to unlock Aligned.</Text>
            </View>
          </WhiteCard>
        </StaggerReveal>
      </ScrollView>
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
  pulseIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  pulseDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.sand },
  pulseLabel: { fontFamily: typography.mono.regular, fontSize: 10, color: colors.sandOnDark, letterSpacing: 1.5 },
  pulseHeadline: { fontFamily: typography.serif.medium, fontSize: 21, fontWeight: '500', color: colors.white, lineHeight: 26, marginBottom: 8, letterSpacing: -0.3 },
  pulseDesc: { fontFamily: typography.body.regular, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 19, marginBottom: 12 },
  pulseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pulseRead: { fontFamily: typography.mono.regular, fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  pulseLink: { fontFamily: typography.body.medium, fontSize: 12, fontWeight: '500', color: colors.sandOnDark },
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
