import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useCorridorOpportunities } from '../../queries/corridor';
import { useExpressInterest, useCorridorActivity, useHasExpressedInterest } from '../../hooks/useCorridorInterest';
import { useAuth } from '../../providers/AuthProvider';
import { colors, typography, spacing, radius, TIER_LEVELS, MembershipTier } from '../../lib/theme';
import {
  WhiteCard,
  SectionLabel,
  Tag,
  KeyholeSmall,
  StaggerReveal,
  FilterPills,
  Badge,
} from '../../components/v2';

// ─── Types ──────────────────────────────────────────────────
interface CorridorOpportunity {
  id: number;
  title: string;
  description: string | null;
  type: string;
  min_tier: string;
  closing_date: string | null;
  partner_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface CorridorActivityItem {
  id: number;
  status: string;
  expressed_at: string;
  opportunity: {
    id: number;
    title: string;
    type: string;
    closing_date: string | null;
    min_tier: string;
  } | null;
}

// ─── Filter options ─────────────────────────────────────────
const FILTER_OPTIONS = ['All', 'Co-Invest', 'Board', 'Speaking', 'Advisory'];

const FILTER_TO_TYPE: Record<string, string | undefined> = {
  All: undefined,
  'Co-Invest': 'co_invest',
  Board: 'board',
  Speaking: 'speaking',
  Advisory: 'advisory',
};

const TIER_BADGE_LABELS: Record<string, string> = {
  member: 'MEMBER+',
  silver: 'SILVER+',
  platinum: 'PLATINUM+',
  laureate: 'LAUREATE',
};

// ─── Helper: days remaining ─────────────────────────────────
function daysRemaining(closingDate: string | null): number | null {
  if (!closingDate) return null;
  const now = new Date();
  const close = new Date(closingDate);
  const diff = Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// ─── Helper: tier check ─────────────────────────────────────
function meetsMinTier(userTier: string, requiredTier: string): boolean {
  const userLevel = TIER_LEVELS[userTier as keyof typeof TIER_LEVELS] ?? 0;
  const requiredLevel = TIER_LEVELS[requiredTier as keyof typeof TIER_LEVELS] ?? 0;
  return userLevel >= requiredLevel;
}

// ─── Opportunity Card ───────────────────────────────────────
function OpportunityCard({ opportunity }: { opportunity: CorridorOpportunity }) {
  const { tier } = useAuth();
  const expressInterest = useExpressInterest();
  const { data: alreadyExpressed, isLoading: checkingInterest } = useHasExpressedInterest(opportunity.id);

  const canAccess = meetsMinTier(tier, opportunity.min_tier);
  const days = daysRemaining(opportunity.closing_date);
  const tierLabel = TIER_BADGE_LABELS[opportunity.min_tier] || 'MEMBER+';

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    expressInterest.mutate(opportunity.id);
  }, [opportunity.id, expressInterest]);

  return (
    <WhiteCard static>
      <View style={styles.cardInner}>
        {/* Top row: icon + tier badge + days */}
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <KeyholeSmall color={colors.sand} size={12} />
          </View>
          <Text style={styles.tierBadge}>{tierLabel}</Text>
          {days !== null && (
            <Text style={styles.daysLeft}>{days}d left</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={1}>{opportunity.title}</Text>

        {/* Description */}
        {opportunity.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{opportunity.description}</Text>
        ) : null}

        {/* Partner */}
        {opportunity.partner_name ? (
          <View style={styles.partnerRow}>
            <Text style={styles.partnerLabel}>Partner</Text>
            <Text style={styles.partnerName}>{opportunity.partner_name}</Text>
          </View>
        ) : null}

        {/* Tags row */}
        <View style={styles.tagsRow}>
          <Tag variant="sand">{opportunity.type.replace('_', '-')}</Tag>
          {!canAccess && <Tag variant="ghost">{`${tierLabel} required`}</Tag>}
        </View>

        {/* Action button */}
        {alreadyExpressed ? (
          <View style={styles.expressedRow}>
            <Text style={styles.expressedText}>Interest Expressed</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.ctaDark,
              !canAccess && styles.ctaDisabled,
              pressed && canAccess && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
            onPress={canAccess ? handlePress : undefined}
            disabled={!canAccess || expressInterest.isPending || checkingInterest}
            accessibilityRole="button"
            accessibilityLabel={canAccess ? `Express interest in ${opportunity.title}` : `Requires ${tierLabel} tier`}
            accessibilityState={{ disabled: !canAccess }}
          >
            {expressInterest.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.ctaDarkText, !canAccess && styles.ctaDisabledText]}>
                {canAccess ? 'Express Interest' : `Requires ${tierLabel}`}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </WhiteCard>
  );
}

// ─── Activity Row ───────────────────────────────────────────
function ActivityRow({ item }: { item: CorridorActivityItem }) {
  const opp = item.opportunity;
  if (!opp) return null;

  const statusLabel = item.status === 'expressed' ? 'Pending' : item.status;
  const expressedDate = new Date(item.expressed_at).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIconBox}>
        <KeyholeSmall color={colors.gray} size={10} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={1}>{opp.title}</Text>
        <Text style={styles.activityMeta}>{expressedDate} &middot; {statusLabel}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────
export default function CorridorScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');

  const filterType = FILTER_TO_TYPE[filter];
  const { data: opportunitiesRaw, isLoading } = useCorridorOpportunities(filterType);
  const opportunities = (opportunitiesRaw ?? []) as CorridorOpportunity[];
  const { data: activityRaw } = useCorridorActivity();
  const activity = (activityRaw ?? []) as unknown as CorridorActivityItem[];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaggerReveal delay={50}>
          {/* Header */}
          <View>
            <Text style={styles.title}>The Corridor</Text>
          </View>
          <Text style={styles.subtitle}>
            Where opportunity is exchanged. The private room, the quiet introduction, the door that opens.
          </Text>

          {/* Filter Pills */}
          <FilterPills
            options={FILTER_OPTIONS}
            selected={filter}
            onSelect={setFilter}
          />

          {/* Loading state */}
          {isLoading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.sand} />
            </View>
          )}

          {/* Opportunities list */}
          {!isLoading && opportunities.length === 0 ? (
            <WhiteCard static>
              <View style={styles.emptyCard}>
                <View style={styles.iconBox}>
                  <KeyholeSmall color={colors.sand} size={12} />
                </View>
                <Text style={styles.emptyTitle}>No Opportunities</Text>
                <Text style={styles.emptyDesc}>
                  {filter === 'All'
                    ? 'The Corridor opens as the network grows. New opportunities will appear here.'
                    : `No ${filter.toLowerCase()} opportunities at the moment.`}
                </Text>
              </View>
            </WhiteCard>
          ) : (
            opportunities.map((opp, i) => (
              <MotiView
                key={opp.id}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 350, delay: 100 + i * 80 }}
              >
                <OpportunityCard opportunity={opp} />
              </MotiView>
            ))
          )}

          {/* Your Activity section */}
          {activity.length > 0 && (
            <>
              <SectionLabel>Your activity</SectionLabel>
              <WhiteCard static>
                {activity.map((item, i) => (
                  <React.Fragment key={item.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <ActivityRow item={item} />
                  </React.Fragment>
                ))}
              </WhiteCard>
            </>
          )}
        </StaggerReveal>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 88 },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: typography.sizes.screenTitle,
    fontWeight: '500',
    color: colors.black,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.body.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.gray,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },

  // Card
  cardInner: { padding: 18, paddingHorizontal: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.sandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadge: {
    fontFamily: typography.geo.medium,
    fontSize: typography.sizes.caption,
    color: colors.sand,
    letterSpacing: typography.spacing.badge,
  },
  daysLeft: {
    marginLeft: 'auto',
    fontFamily: typography.mono.regular,
    fontSize: typography.sizes.tiny,
    color: colors.grayLight,
  },
  cardTitle: {
    fontFamily: typography.serif.medium,
    fontSize: typography.sizes.cardTitle,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontFamily: typography.body.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.gray,
    lineHeight: 19,
    marginBottom: 8,
  },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  partnerLabel: {
    fontFamily: typography.mono.regular,
    fontSize: typography.sizes.tiny,
    color: colors.grayLight,
    letterSpacing: typography.spacing.mono,
    textTransform: 'uppercase',
  },
  partnerName: {
    fontFamily: typography.body.medium,
    fontSize: typography.sizes.meta,
    fontWeight: '500',
    color: colors.black,
  },
  tagsRow: { flexDirection: 'row', marginBottom: 14 },

  // CTA
  ctaDark: {
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
  },
  ctaDarkText: {
    fontFamily: typography.body.medium,
    fontSize: typography.sizes.bodySmall,
    fontWeight: '500',
    color: colors.white,
  },
  ctaDisabled: {
    backgroundColor: colors.ghost,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  ctaDisabledText: {
    color: colors.grayLight,
  },

  // Expressed state
  expressedRow: {
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.sandLight,
    alignItems: 'center',
  },
  expressedText: {
    fontFamily: typography.body.medium,
    fontSize: typography.sizes.bodySmall,
    fontWeight: '500',
    color: colors.sand,
  },

  // Activity
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activityIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.ghost,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: { flex: 1 },
  activityTitle: {
    fontFamily: typography.body.medium,
    fontSize: typography.sizes.body,
    fontWeight: '500',
    color: colors.black,
  },
  activityMeta: {
    fontFamily: typography.mono.regular,
    fontSize: typography.sizes.meta,
    color: colors.grayLight,
    marginTop: 2,
    letterSpacing: typography.spacing.mono,
  },
  divider: {
    height: 1,
    backgroundColor: colors.rule,
    marginHorizontal: 16,
  },

  // Loading
  loadingBox: { paddingVertical: 32, alignItems: 'center' },

  // Empty states
  emptyCard: { padding: 18, paddingHorizontal: 16, alignItems: 'center' },
  emptyTitle: {
    fontFamily: typography.serif.medium,
    fontSize: typography.sizes.cardTitle,
    fontWeight: '500',
    color: colors.black,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: typography.body.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 19,
  },
});
