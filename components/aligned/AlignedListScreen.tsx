import React, { useState, useCallback, useMemo } from 'react';
import {
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
import { AlignedTile as AlignedTileBase } from '../../types/database';
import MutualRevealOverlay from './MutualRevealOverlay';

// ─── Types ──────────────────────────────────────────────
// Extend the canonical AlignedTile with UI-specific display fields
interface AlignedTileUI extends Pick<AlignedTileBase, 'id' | 'type' | 'description' | 'tags'> {
  tier: 'laureate' | 'platinum' | 'silver' | 'member';
  gradientKey: string;
}

// ─── Tile data (real data via query — empty until populated) ──
const PROJECT_TILES: AlignedTileUI[] = [];

const INTEREST_TILES: AlignedTileUI[] = [];

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

  const tiles = mode === 'projects' ? PROJECT_TILES : INTEREST_TILES;
  const filters = mode === 'projects' ? PROJECT_FILTERS : INTEREST_FILTERS;
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  const visibleTiles = useMemo(() => {
    return tiles.filter((t) => {
      if (skippedIds.has(t.id)) return false;
      if (activeFilter === 'All') return true;
      return t.tags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()));
    });
  }, [tiles, skippedIds, activeFilter]);

  const handleSkip = useCallback(
    (id: string) => {
      setSkippedIds((prev) => new Set(prev).add(id));
    },
    []
  );

  const handleAlign = useCallback((_id: string) => {
    // TODO: Check server for mutual alignment, then set revealData + setShowReveal(true)
  }, []);

  const title = mode === 'projects' ? 'Projects' : 'Interests';
  const count = visibleTiles.length;

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
        <Text style={styles.listCount}>{count} aligned</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tiles yet. Create the first one.</Text>
          </View>
        }
      />

      {/* Mutual Reveal Overlay — only shown when real mutual alignment data triggers it */}
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
