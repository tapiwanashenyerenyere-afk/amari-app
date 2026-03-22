import React, { useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeOut } from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { useMyProfile } from '../../queries/members';
import {
  useAlignedDiscoveryTiles,
  useExpressAlignedInterest,
  useSkipAlignedTile,
  type AlignedDiscoveryTile,
  type AlignedRevealMember,
} from '../../queries/aligned';
import type { MembershipTier } from '../../types/db-helpers';
import MutualRevealOverlay from './MutualRevealOverlay';

// ─── Types ──────────────────────────────────────────────
interface AlignedTileUI extends Pick<AlignedDiscoveryTile, 'id' | 'type' | 'description' | 'tags'> {
  tier: MembershipTier;
  gradientKey: string;
  recommendationScore: number;
}

const PROJECT_FILTERS = ['All', 'Tech', 'Health', 'Finance', 'Culture', 'Education'];
const INTEREST_FILTERS = ['All', 'Ethics', 'Investing', 'Design', 'Policy'];

// ─── Gradient map for thumbnails ────────────────────────
const GRADIENTS: Record<string, [string, string]> = {
  warm: ['#2a1a18', '#111111'],
  cool: ['#111128', '#111111'],
  green: ['#1a221a', '#111111'],
  rose: ['#2a1820', '#111111'],
  earth: ['#201a18', '#111111'],
};

const TIER_COLORS: Record<string, string> = {
  laureate: colors.sandOnDark,
  platinum: colors.tierPlatinum,
  silver: colors.tierSilver,
  member: colors.gray,
};

function toWords(values: Array<string | null | undefined>): string[] {
  return values
    .flatMap((value) => (value ?? '').toLowerCase().split(/[^a-z0-9]+/))
    .filter(Boolean);
}

function computeRecommendationScore(
  tile: AlignedDiscoveryTile,
  profile: Record<string, unknown> | null | undefined,
) {
  const skillSet = new Set(
    toWords([
      ...(Array.isArray(profile?.skills) ? (profile.skills as string[]) : []),
      ...(Array.isArray(profile?.interests) ? (profile.interests as string[]) : []),
      typeof profile?.current_project === 'string' ? profile.current_project : null,
      typeof profile?.industry === 'string' ? profile.industry : null,
      typeof profile?.company === 'string' ? profile.company : null,
    ])
  );

  if (skillSet.size === 0) {
    return 0;
  }

  const tileWords = new Set(toWords([tile.description, ...(tile.tags ?? []), tile.location]));
  let score = 0;

  tileWords.forEach((word) => {
    if (skillSet.has(word)) {
      score += 1;
    }
  });

  return score;
}

function pickGradientKey(tile: Pick<AlignedDiscoveryTile, 'tags' | 'description'>) {
  const haystack = `${tile.tags.join(' ')} ${tile.description}`.toLowerCase();

  if (haystack.includes('design') || haystack.includes('culture') || haystack.includes('brand')) {
    return 'rose';
  }

  if (haystack.includes('climate') || haystack.includes('health') || haystack.includes('wellness')) {
    return 'green';
  }

  if (haystack.includes('ai') || haystack.includes('data') || haystack.includes('tech')) {
    return 'cool';
  }

  if (haystack.includes('finance') || haystack.includes('invest')) {
    return 'earth';
  }

  return 'warm';
}

function buildRevealData(member: AlignedRevealMember) {
  const initials = member.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const role = member.title || member.company || member.city || 'AMARI member';

  return {
    name: member.full_name,
    initials,
    role,
    tier: member.tier.toUpperCase(),
  };
}

// ─── Tile Component ─────────────────────────────────────
function TileItem({
  tile,
  onSkip,
  onAlign,
}: {
  tile: AlignedTileUI;
  onSkip: (id: string) => void;
  onAlign: (id: string) => void;
}) {
  const gradient = GRADIENTS[tile.gradientKey] || GRADIENTS.warm;
  const tierColor = TIER_COLORS[tile.tier];

  return (
    <Animated.View
      exiting={FadeOut.duration(300)}
      style={styles.tileRow}
    >
      {/* Thumbnail */}
      <View style={styles.thumb}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Tier dot */}
        <View
          style={[
            styles.tierDot,
            {
              backgroundColor: tierColor,
              borderColor:
                tile.tier === 'laureate'
                  ? tierColor
                  : 'rgba(255,255,255,0.15)',
            },
          ]}
        />
      </View>

      {/* Content */}
      <View style={styles.tileContent}>
        <Text style={styles.tileDesc} numberOfLines={2}>
          {tile.description}
        </Text>
        <View style={styles.tagRow}>
          {tile.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                tag === tile.tags[0] ? styles.tagSkill : styles.tagContext,
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  tag === tile.tags[0]
                    ? styles.tagTextSkill
                    : styles.tagTextContext,
                ]}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.tileActions}>
          <Pressable
            style={styles.btnSkip}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSkip(tile.id);
            }}
            accessibilityRole="button"
            accessibilityLabel="Skip this tile"
          >
            <Text style={styles.btnSkipText}>Skip</Text>
          </Pressable>
          <Pressable
            style={styles.btnAlign}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAlign(tile.id);
            }}
            accessibilityRole="button"
            accessibilityLabel="Express interest in this tile"
          >
            <Text style={styles.btnAlignText}>Align</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Filter Pill ────────────────────────────────────────
function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Main List Screen ───────────────────────────────────
export default function AlignedListScreen({
  mode,
}: {
  mode: 'projects' | 'interests';
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showReveal, setShowReveal] = useState(false);
  const [revealData, setRevealData] = useState<{ name: string; initials: string; role: string; tier: string } | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const tileType = mode === 'projects' ? 'project' : 'interest';
  const filters = mode === 'projects' ? PROJECT_FILTERS : INTEREST_FILTERS;
  const { data: profile } = useMyProfile();
  const { data: tiles = [], isLoading, isError } = useAlignedDiscoveryTiles(tileType);
  const skipTile = useSkipAlignedTile();
  const expressInterest = useExpressAlignedInterest();

  const visibleTiles = useMemo(() => {
    return tiles
      .map((tile) => ({
        id: tile.id,
        type: tile.type,
        description: tile.description,
        tags: tile.tags ?? [],
        tier: tile.owner_tier,
        gradientKey: pickGradientKey(tile),
        recommendationScore: computeRecommendationScore(tile, profile),
      }))
      .filter((tile) => {
        if (dismissedIds.has(tile.id)) {
          return false;
        }

        if (activeFilter === 'All') {
          return true;
        }

        return tile.tags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()));
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore || a.description.localeCompare(b.description));
  }, [tiles, dismissedIds, activeFilter, profile]);

  const handleSkip = useCallback(
    (id: string) => {
      setDismissedIds((prev) => new Set(prev).add(id));
      skipTile.mutate(id, {
        onError: () => {
          setDismissedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          Alert.alert('Could not skip tile', 'Please try again.');
        },
      });
    },
    [skipTile]
  );

  const handleAlign = useCallback(
    (id: string) => {
      setDismissedIds((prev) => new Set(prev).add(id));
      expressInterest.mutate(id, {
        onSuccess: (result) => {
          if (result.mutual && result.revealed_member) {
            setRevealData(buildRevealData(result.revealed_member));
            setShowReveal(true);
          }
        },
        onError: (error: Error) => {
          setDismissedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          Alert.alert('Could not align', error.message || 'Please try again.');
        },
      });
    },
    [expressInterest]
  );

  const title = mode === 'projects' ? 'Projects' : 'Interests';
  const count = visibleTiles.length;

  const listEmpty = (() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.sand} />
          <Text style={styles.emptyText}>Loading aligned recommendations…</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aligned is temporarily unavailable. Please try again.</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No recommendations yet. Add your own tile or refine your profile.</Text>
      </View>
    );
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.listHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>{'\u2039'}</Text>
        </Pressable>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listCount}>{count} recommended</Text>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {filters.map((f) => (
          <FilterPill
            key={f}
            label={f}
            active={activeFilter === f}
            onPress={() => setActiveFilter(f)}
          />
        ))}
      </ScrollView>

      {/* Tile List */}
      <FlatList
        data={visibleTiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TileItem
            tile={item}
            onSkip={handleSkip}
            onAlign={handleAlign}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmpty}
      />

      {/* Mutual Reveal Overlay */}
      {showReveal && revealData && (
        <MutualRevealOverlay
          name={revealData.name}
          initials={revealData.initials}
          role={revealData.role}
          tier={revealData.tier}
          onStartConversation={() => {
            setShowReveal(false);
            Alert.alert(
              'Coming Soon',
              'Messaging will be available in a future update.'
            );
          }}
          onClose={() => setShowReveal(false)}
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },

  // List header
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.gray,
    marginTop: -2,
  },
  listTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    color: colors.black,
  },
  listCount: {
    marginLeft: 'auto',
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
  },

  // Filters
  filterScroll: { maxHeight: 44, marginBottom: 8 },
  filterRow: {
    paddingHorizontal: spacing.xl,
    gap: 6,
    alignItems: 'center',
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  pillText: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.gray,
  },
  pillTextActive: {
    color: colors.bone,
  },

  // List content
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },

  // Tile row
  tileRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    alignItems: 'flex-start',
  },

  // Thumbnail
  thumb: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  tierDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    zIndex: 2,
  },

  // Tile content
  tileContent: {
    flex: 1,
    paddingTop: 2,
  },
  tileDesc: {
    fontFamily: typography.geo.semiBold,
    fontSize: 14,
    color: colors.black,
    lineHeight: 19,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagSkill: {
    backgroundColor: 'rgba(139,115,85,0.08)',
    borderColor: 'rgba(139,115,85,0.1)',
  },
  tagContext: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderColor: 'rgba(0,0,0,0.03)',
  },
  tagText: {
    fontFamily: typography.body.medium,
    fontSize: 10,
  },
  tagTextSkill: {
    color: colors.sand,
  },
  tagTextContext: {
    color: colors.gray,
  },

  // Actions
  tileActions: {
    flexDirection: 'row',
    gap: 6,
  },
  btnSkip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: colors.rule,
  },
  btnSkipText: {
    fontFamily: typography.body.semiBold,
    fontSize: 11,
    color: colors.gray,
  },
  btnAlign: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.black,
  },
  btnAlignText: {
    fontFamily: typography.body.semiBold,
    fontSize: 11,
    color: colors.bone,
  },

  // Empty state
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
  },
});
