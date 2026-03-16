import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../providers/AuthProvider';
import { useLatestPulse } from '../../queries/pulse';
import { useEvents } from '../../queries/events';
import { useMyProfile } from '../../queries/members';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { TIER_DISPLAY_NAMES } from '../../lib/theme';
import {
  WhiteCard,
  HeroCard,
  SectionLabel,
  EventRow,
  Badge,
  ProgressBar,
  AvatarStack,
  StaggerReveal,
} from '../../components/v2';
import { BreathingDot } from '../../components/v2/BreathingDot';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();
}

export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, tier } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: pulse } = useLatestPulse();
  const { data: events } = useEvents('upcoming');

  const firstName = useMemo(() => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    return 'there';
  }, [profile]);

  const tierLabel = tier ? TIER_DISPLAY_NAMES[tier] || tier.toUpperCase() : 'MEMBER';

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
          {/* Greeting */}
          <View>
            <Text style={styles.date}>{formatDate()}</Text>
            <Text style={styles.greeting} accessibilityRole="header">{getGreeting()}, {firstName}</Text>
            <Badge>{tierLabel}</Badge>
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
              {pulse?.headline || 'The Architecture of\nAustralian Innovation'}
            </Text>
            <Text style={styles.pulseDesc}>
              {pulse?.summary_content || 'How three AMARI members are reshaping enterprise infrastructure from Melbourne.'}
            </Text>
            <View style={styles.pulseFooter}>
              <Text style={styles.pulseRead}>4 min read</Text>
              <Text style={styles.pulseLink}>Read →</Text>
            </View>
          </HeroCard>

          {/* Upcoming Events */}
          <SectionLabel>Upcoming</SectionLabel>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event: any, i: number) => {
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
              <EventRow day="28" month="MAR" title="Founders' Dinner" meta="The Langham · 24 seats" tier="PLAT" onPress={() => {}} />
              <EventRow day="05" month="APR" title="Innovation Talk" meta="AMARI House" dimDate onPress={() => {}} />
            </>
          )}

          {/* Featured Event — Dark card inside white card */}
          <WhiteCard onPress={() => {}}>
            <View style={styles.featuredInner}>
              <Text style={styles.featuredLabel}>FEATURED</Text>
              <Text style={styles.featuredTitle}>Annual Gala 2026</Text>
              <Text style={styles.featuredMeta}>April 19 · Crown Palladium · Black Tie</Text>
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
});
