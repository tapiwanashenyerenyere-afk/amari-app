import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useCorridorOpportunities, useExpressInterest, useCorridorActivity, useHasExpressedInterest } from '../../hooks/useCorridorInterest';
import { useAuth } from '../../providers/AuthProvider';
import { useMyProfile } from '../../queries/members';
import { colors, typography, spacing, radius, TIER_LEVELS } from '../../lib/theme';
import {
  WhiteCard,
  SectionLabel,
  Tag,
  KeyholeSmall,
  StaggerReveal,
  FilterPills,
  Badge,
} from '../../components/v2';
import type { CorridorOpportunity, CorridorInterest } from '../../types/db-helpers';
import { FullCardOverlay } from '../../components/card/FullCardOverlay';

// ─── Types ──────────────────────────────────────────────────
interface CorridorActivityItem extends Pick<CorridorInterest, 'id' | 'expressed_at'> {
  status: CorridorInterest['status'] | 'expressed';
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

// ─── Helper: days remaining ─────────────────────────────────
function daysRemaining(closingDate: string | null): number | null {
  if (!closingDate) return null;
  const now = new Date();
  const close = new Date(closingDate);
  const diff = Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

// ─── Helper: corridor access check ──────────────────────────
function hasCorridorAccess(userTier: string): boolean {
  const userLevel = TIER_LEVELS[userTier as keyof typeof TIER_LEVELS] ?? 0;
  return userLevel >= TIER_LEVELS.silver;
}

function getCardPillBackground(tier: string) {
  if (tier === 'laureate') return colors.tierPlatinum;
  if (tier === 'silver') return '#E7E1D9';
  return colors.black;
}

function getCardPillText(tier: string) {
  if (tier === 'silver') return colors.black;
  return colors.bone;
}

// ─── Opportunity Card ───────────────────────────────────────
function OpportunityCard({ opportunity }: { opportunity: CorridorOpportunity }) {
  const { tier } = useAuth();
  const expressInterest = useExpressInterest();
  const { data: alreadyExpressed = false } = useHasExpressedInterest(opportunity.id);

  const canAccess = hasCorridorAccess(tier);
  const days = daysRemaining(opportunity.closing_date);
  const isExpired = days !== null && days <= 0;
  const accessLabel = canAccess ? 'SILVER+ ACCESS' : 'SILVER+ REQUIRED';

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    expressInterest.mutate(opportunity.id);
  }, [opportunity.id, expressInterest]);

  return (
    <WhiteCard static>
      <View style={styles.cardInner} accessible={true} accessibilityLabel={`${opportunity.title}. ${opportunity.description || ''} ${accessLabel}`}>
        {/* Top row: icon + tier badge + days */}
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <KeyholeSmall color={colors.sand} size={12} />
          </View>
          <Text style={styles.tierBadge}>{accessLabel}</Text>
          {days !== null && (
            isExpired
              ? <Badge>Closed</Badge>
              : <Text style={styles.daysLeft}>{days}d left</Text>
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
          {!canAccess && <Tag variant="ghost">Silver required</Tag>}
        </View>

        {/* Action button */}
        {isExpired ? (
          <View style={styles.expressedRow}>
            <Text style={styles.expressedText}>Opportunity Closed</Text>
          </View>
        ) : alreadyExpressed ? (
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
            disabled={!canAccess || expressInterest.isPending}
            accessibilityRole="button"
            accessibilityLabel={canAccess ? `Express interest in ${opportunity.title}` : 'Requires Silver membership'}
            accessibilityState={{ disabled: !canAccess || expressInterest.isPending }}
          >
            {expressInterest.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.ctaDarkText, !canAccess && styles.ctaDisabledText]}>
                {canAccess ? 'Express Interest' : 'Requires Silver+'}
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
  const expressedDate = item.expressed_at
    ? new Date(item.expressed_at).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
      })
    : 'Pending';

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
  const { tier } = useAuth();
  const { data: profile } = useMyProfile();
  const [filter, setFilter] = useState('All');
  const [showCardOverlay, setShowCardOverlay] = useState(false);

  const filterType = FILTER_TO_TYPE[filter];
  // Note: server-side filtering of expired/inactive opportunities is handled by RLS policies
  const { data: opportunities = [], isLoading } = useCorridorOpportunities(filterType);
  const { data: activity = [] } = useCorridorActivity() as { data: CorridorActivityItem[] | undefined };
  const canAccessCorridor = hasCorridorAccess(tier);

  if (!canAccessCorridor) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.memberGate}>
          <Text style={styles.memberGateTitle}>The Corridor opens from Silver membership.</Text>
          <Text style={styles.memberGateCopy}>
            This room is reserved for Silver, Platinum, and Laureate members. Upgrade access to view and act on live opportunities.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaggerReveal delay={50}>
          <View style={styles.topBar}>
            <Pressable
              style={styles.helpPill}
              onPress={() => Alert.alert('Corridor help', 'The Corridor surfaces private opportunities for Silver, Platinum, and Laureate members to review and act on.')}
            >
              <Text style={styles.helpPillText}>Help</Text>
            </Pressable>

            <Pressable
              style={[
                styles.cardPill,
                {
                  backgroundColor: getCardPillBackground(tier),
                },
              ]}
              onPress={() => setShowCardOverlay(true)}
            >
              <Text style={[styles.cardPillText, { color: getCardPillText(tier) }]}>Card</Text>
            </Pressable>
          </View>

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
                <Text style={styles.emptyTitle}>The room is quiet</Text>
                <Text style={styles.emptyDesc}>
                  {filter === 'All'
                    ? 'No private openings are live right now. When AMARI has a board role, advisory brief, or quiet introduction to make, it will appear here first.'
                    : `No ${filter.toLowerCase()} openings are live right now. Try another lens or check back after the next drop.`}
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

      {profile && (
        <FullCardOverlay
          profile={{
            full_name: profile.full_name,
            display_id: profile.display_id,
            title: profile.title,
            company: profile.company,
            city: profile.city,
            created_at: profile.created_at,
            tier,
          }}
          visible={showCardOverlay}
          onClose={() => setShowCardOverlay(false)}
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 88 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  helpPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  helpPillText: {
    fontFamily: typography.body.medium,
    fontSize: typography.sizes.meta,
    color: colors.gray,
  },
  cardPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  cardPillText: {
    fontFamily: typography.body.semiBold,
    fontSize: typography.sizes.bodySmall,
    letterSpacing: 0.3,
  },
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
  memberGate: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 88,
  },
  memberGateTitle: {
    fontFamily: typography.serif.medium,
    fontSize: typography.sizes.screenTitle,
    color: colors.black,
    lineHeight: 34,
  },
  memberGateCopy: {
    fontFamily: typography.body.regular,
    fontSize: typography.sizes.body,
    color: colors.gray,
    lineHeight: 21,
    marginTop: 10,
  },
});
