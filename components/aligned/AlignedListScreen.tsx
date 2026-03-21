import React, { useState, useCallback } from 'react';
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
import Animated, { FadeOut, SlideOutLeft } from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../../lib/theme';
import MutualRevealOverlay from './MutualRevealOverlay';

// ─── Types ──────────────────────────────────────────────
interface AlignedTile {
  id: string;
  type: 'project' | 'interest';
  description: string;
  tags: string[];
  tier: 'laureate' | 'platinum' | 'silver' | 'member';
  gradientKey: string;
}

// ─── Demo Data ──────────────────────────────────────────
const PROJECT_TILES: AlignedTile[] = [
  { id: '1', type: 'project', description: 'AI-powered regulatory compliance tool for healthcare startups', tags: ['HealthTech', 'AI/ML'], tier: 'laureate', gradientKey: 'warm' },
  { id: '2', type: 'project', description: 'Cross-border payments infrastructure for African diaspora remittances', tags: ['Fintech', 'Payments'], tier: 'platinum', gradientKey: 'cool' },
  { id: '3', type: 'project', description: 'Community-owned solar microgrid platform for regional communities', tags: ['CleanTech', 'Community'], tier: 'silver', gradientKey: 'green' },
  { id: '4', type: 'project', description: 'Digital marketplace connecting African artisans with global buyers', tags: ['Culture', 'E-Commerce'], tier: 'platinum', gradientKey: 'rose' },
  { id: '5', type: 'project', description: 'EdTech platform bridging skills gaps in emerging tech sectors', tags: ['Education', 'Tech'], tier: 'laureate', gradientKey: 'earth' },
];

const INTEREST_TILES: AlignedTile[] = [
  { id: '10', type: 'interest', description: 'Ethical frameworks for deploying emerging technologies in developing markets', tags: ['Ethics', 'Tech Policy'], tier: 'laureate', gradientKey: 'cool' },
  { id: '11', type: 'interest', description: 'Impact investing models that prioritise community ownership', tags: ['Investing', 'Impact'], tier: 'platinum', gradientKey: 'warm' },
  { id: '12', type: 'interest', description: 'Design systems that centre African visual traditions', tags: ['Design', 'Culture'], tier: 'silver', gradientKey: 'rose' },
  { id: '13', type: 'interest', description: 'Policy advocacy for diaspora economic participation', tags: ['Policy', 'Advocacy'], tier: 'laureate', gradientKey: 'green' },
  { id: '14', type: 'interest', description: 'Mentorship models that scale without losing depth', tags: ['Mentorship', 'Community'], tier: 'platinum', gradientKey: 'earth' },
];

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
  laureate: '#C4A882',
  platinum: '#722F37',
  silver: '#9898a0',
  member: '#767676',
};

// ─── Tile Component ─────────────────────────────────────
function TileItem({
  tile,
  onSkip,
  onAlign,
}: {
  tile: AlignedTile;
  onSkip: (id: string) => void;
  onAlign: (id: string) => void;
}) {
  const gradient = GRADIENTS[tile.gradientKey] || GRADIENTS.warm;
  const tierColor = TIER_COLORS[tile.tier];

  return (
    <Animated.View
      exiting={FadeOut.duration(300).withCallback(() => {})}
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
          >
            <Text style={styles.btnSkipText}>Skip</Text>
          </Pressable>
          <Pressable
            style={styles.btnAlign}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAlign(tile.id);
            }}
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

  const tiles = mode === 'projects' ? PROJECT_TILES : INTEREST_TILES;
  const filters = mode === 'projects' ? PROJECT_FILTERS : INTEREST_FILTERS;
  const [visibleTiles, setVisibleTiles] = useState(tiles);

  const handleSkip = useCallback(
    (id: string) => {
      setVisibleTiles((prev) => prev.filter((t) => t.id !== id));
    },
    []
  );

  const handleAlign = useCallback((id: string) => {
    // Demo: show mutual reveal on the third align
    setShowReveal(true);
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
      />

      {/* Mutual Reveal Overlay */}
      {showReveal && (
        <MutualRevealOverlay
          name="Dr. Amara Kofi"
          initials="AK"
          role="Health-Tech Founder"
          tier="Laureate"
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
    color: '#8a7340',
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
    paddingVertical: 7,
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
});
