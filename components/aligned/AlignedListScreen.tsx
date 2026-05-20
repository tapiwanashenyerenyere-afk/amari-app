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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeOut } from 'react-native-reanimated';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { useMyProfile } from '../../queries/members';
import {
  useAlignedDiscoveryTiles,
  useAlignedTileContact,
  useExpressAlignedInterest,
  useSkipAlignedTile,
  type AlignedDiscoveryTile,
  type AlignedRevealMember,
} from '../../queries/aligned';
import type { MembershipTier } from '../../types/db-helpers';
import MutualRevealOverlay from './MutualRevealOverlay';

// ─── Types ──────────────────────────────────────────────
interface AlignedTileUI extends Pick<AlignedDiscoveryTile, 'id' | 'type' | 'description' | 'tags' | 'location'> {
  tier: MembershipTier;
  contactEnabled: boolean;
  gradientKey: string;
  imageUrl: string | null;
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

const LOCATION_PENDING = 'Location pending';

const LOCATION_POINTS: Record<string, { x: number; y: number }> = {
  melbourne: { x: 230, y: 112 },
  sydney: { x: 255, y: 86 },
  brisbane: { x: 265, y: 62 },
  perth: { x: 72, y: 102 },
  adelaide: { x: 196, y: 106 },
  canberra: { x: 246, y: 98 },
  hobart: { x: 236, y: 132 },
  darwin: { x: 154, y: 28 },
  auckland: { x: 292, y: 116 },
  london: { x: 145, y: 44 },
  lagos: { x: 156, y: 76 },
  nairobi: { x: 182, y: 78 },
  newyork: { x: 86, y: 58 },
  singapore: { x: 198, y: 72 },
  remote: { x: 160, y: 74 },
  global: { x: 160, y: 74 },
};

const FALLBACK_POINTS = [
  { x: 138, y: 66 },
  { x: 176, y: 58 },
  { x: 204, y: 90 },
  { x: 118, y: 98 },
  { x: 236, y: 74 },
];

function normalizeLocation(location: string | null | undefined) {
  const value = (location ?? '').trim();
  return value.length > 0 ? value : LOCATION_PENDING;
}

function getLocationPoint(label: string, index: number) {
  const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const matchedKey = Object.keys(LOCATION_POINTS).find((key) => normalized.includes(key));

  if (matchedKey) {
    return LOCATION_POINTS[matchedKey];
  }

  return FALLBACK_POINTS[index % FALLBACK_POINTS.length];
}

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
  onEmail,
}: {
  tile: AlignedTileUI;
  onSkip: (id: string) => void;
  onAlign: (id: string) => void;
  onEmail: (tile: AlignedTileUI) => void;
}) {
  const gradient = GRADIENTS[tile.gradientKey] || GRADIENTS.warm;
  const tierColor = TIER_COLORS[tile.tier];
  const locationLabel = normalizeLocation(tile.location);

  return (
    <Animated.View
      exiting={FadeOut.duration(300)}
      style={styles.tileRow}
    >
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {tile.imageUrl ? (
          <Image
            source={{ uri: tile.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.thumbShade} />
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
        <Text style={styles.tileDesc} numberOfLines={3}>
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
        <View style={styles.locationLine}>
          <Text style={styles.locationMeta}>{tile.type === 'project' ? 'Location' : 'Signal'}</Text>
          <Text style={styles.locationValue} numberOfLines={1}>{locationLabel}</Text>
        </View>
        {tile.recommendationScore > 0 ? (
          <View style={styles.matchHint}>
            <Text style={styles.matchHintText}>Profile signal match</Text>
          </View>
        ) : null}
        {tile.type === 'project' && tile.contactEnabled ? (
          <View style={styles.contactHint}>
            <Text style={styles.contactHintText}>Email contact available</Text>
          </View>
        ) : null}
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
          {tile.type === 'project' && tile.contactEnabled ? (
            <Pressable
              style={styles.btnEmail}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onEmail(tile);
              }}
              accessibilityRole="button"
              accessibilityLabel="Open your email app to contact this project owner"
            >
              <Text style={styles.btnEmailText}>Email</Text>
            </Pressable>
          ) : null}
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

function ProjectLocationAtlas({
  options,
  activeLocation,
  onSelectLocation,
}: {
  options: Array<{ label: string; count: number }>;
  activeLocation: string;
  onSelectLocation: (location: string) => void;
}) {
  if (options.length <= 1) {
    return null;
  }

  const clusters = options.filter((option) => option.label !== 'All').slice(0, 8);

  return (
    <View style={styles.atlasCard}>
      <View style={styles.atlasHeader}>
        <View>
          <Text style={styles.atlasKicker}>Project map</Text>
          <Text style={styles.atlasTitle}>Where projects are based</Text>
        </View>
        <Text style={styles.atlasCount}>{options[0]?.count ?? 0} visible</Text>
      </View>

      <View style={styles.atlasMap}>
        <Svg width="100%" height="142" viewBox="0 0 320 142">
          <Rect x="0" y="0" width="320" height="142" rx="14" fill="#151412" />
          <Line x1="28" y1="76" x2="292" y2="76" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <Line x1="160" y1="18" x2="160" y2="124" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <Circle cx="160" cy="76" r="48" fill="none" stroke="rgba(196,168,130,0.08)" strokeWidth="1" />
          <Circle cx="160" cy="76" r="80" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          {clusters.map((cluster, index) => {
            const point = getLocationPoint(cluster.label, index);
            const active = activeLocation === cluster.label;
            const radiusSize = Math.min(18, 8 + cluster.count * 2);

            return (
              <React.Fragment key={cluster.label}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={radiusSize}
                  fill={active ? colors.sandOnDark : 'rgba(196,168,130,0.62)'}
                  opacity={active ? 1 : 0.76}
                />
                <SvgText
                  x={point.x}
                  y={point.y + 3}
                  fill="#111111"
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {cluster.count}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.locationPillRow}
      >
        {options.map((option) => {
          const active = activeLocation === option.label;
          return (
            <Pressable
              key={option.label}
              style={[styles.locationPill, active && styles.locationPillActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectLocation(option.label);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Show ${option.label} projects`}
            >
              <Text style={[styles.locationPillText, active && styles.locationPillTextActive]}>
                {option.label} · {option.count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
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
  const [activeLocation, setActiveLocation] = useState('All');
  const [showReveal, setShowReveal] = useState(false);
  const [revealData, setRevealData] = useState<{ name: string; initials: string; role: string; tier: string } | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const tileType = mode === 'projects' ? 'project' : 'interest';
  const filters = mode === 'projects' ? PROJECT_FILTERS : INTEREST_FILTERS;
  const { data: profile } = useMyProfile();
  const { data: tiles = [], isLoading, isError } = useAlignedDiscoveryTiles(tileType);
  const skipTile = useSkipAlignedTile();
  const expressInterest = useExpressAlignedInterest();
  const tileContact = useAlignedTileContact();

  const scoredTiles = useMemo(() => {
    return tiles
      .map((tile) => ({
        id: tile.id,
        type: tile.type,
        description: tile.description,
        tags: tile.tags ?? [],
        location: tile.location,
        tier: tile.owner_tier,
        contactEnabled: tile.contact_enabled === true,
        gradientKey: pickGradientKey(tile),
        imageUrl: tile.image_url,
        recommendationScore: computeRecommendationScore(tile, profile),
      }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore || a.description.localeCompare(b.description));
  }, [tiles, profile]);

  const availableTiles = useMemo(
    () => scoredTiles.filter((tile) => !dismissedIds.has(tile.id)),
    [scoredTiles, dismissedIds]
  );

  const locationOptions = useMemo(() => {
    if (mode !== 'projects') {
      return [];
    }

    const counts = new Map<string, number>();
    availableTiles.forEach((tile) => {
      const label = normalizeLocation(tile.location);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    const orderedLocations = Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    return [{ label: 'All', count: availableTiles.length }, ...orderedLocations];
  }, [availableTiles, mode]);

  const visibleTiles = useMemo(() => {
    return availableTiles.filter((tile) => {
      if (activeFilter !== 'All') {
        const hasTag = tile.tags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()));
        if (!hasTag) {
          return false;
        }
      }

      if (activeLocation !== 'All' && normalizeLocation(tile.location) !== activeLocation) {
        return false;
      }

      return true;
    });
  }, [availableTiles, activeFilter, activeLocation]);

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

  const handleEmail = useCallback(
    (tile: AlignedTileUI) => {
      Alert.alert(
        'Open your email app?',
        'AMARI will hand this over to your installed email app. The project owner chose to be contacted by email for this project.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              tileContact.mutate(tile.id, {
                onSuccess: async (result) => {
                  const subject = encodeURIComponent(result.subject || 'AMARI project enquiry');
                  const body = encodeURIComponent(
                    `Hello${result.full_name ? ` ${result.full_name}` : ''},\n\nI saw your project on AMARI and wanted to reach out.\n\nProject: ${result.tile_description || tile.description}\n\nBest,\n`
                  );
                  const mailtoUrl = `mailto:${result.email}?subject=${subject}&body=${body}`;

                  try {
                    const supported = await Linking.canOpenURL(mailtoUrl);
                    if (!supported) {
                      Alert.alert('Email unavailable', 'No email app is available on this device right now.');
                      return;
                    }
                    await Linking.openURL(mailtoUrl);
                  } catch (error) {
                    console.error('Open mail app failed:', error);
                    Alert.alert('Email unavailable', 'Could not open your email app on this device.');
                  }
                },
                onError: (error: Error) => {
                  Alert.alert('Email unavailable', error.message || 'Email contact is not available for this project.');
                },
              });
            },
          },
        ]
      );
    },
    [tileContact]
  );

  const title = mode === 'projects' ? 'Projects' : 'Interests';
  const count = visibleTiles.length;
  const listSubtitle = mode === 'projects'
    ? 'Approved projects with location, tags, and shared profile signals.'
    : 'Interest tiles from members who care about similar themes.';

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
        <Text style={styles.emptyText}>
          {activeFilter !== 'All' || activeLocation !== 'All'
            ? 'No tiles match these filters yet. Try All or complete your profile for broader recommendations.'
            : 'No recommendations yet. Add your own tile or refine your profile signals.'}
        </Text>
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
        <View style={styles.listTitleWrap}>
          <Text style={styles.listTitle}>{title}</Text>
          <Text style={styles.listSubtitle}>{listSubtitle}</Text>
        </View>
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

      {mode === 'projects' ? (
        <ProjectLocationAtlas
          options={locationOptions}
          activeLocation={activeLocation}
          onSelectLocation={setActiveLocation}
        />
      ) : null}

      {/* Tile List */}
      <FlatList
        data={visibleTiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TileItem
            tile={item}
            onSkip={handleSkip}
            onAlign={handleAlign}
            onEmail={handleEmail}
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
              'Use Email For Outreach',
              'AMARI is not using in-app messaging yet. Outreach should happen through email outside the app.'
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
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  listTitleWrap: {
    flex: 1,
  },
  listSubtitle: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    lineHeight: 17,
    marginTop: 2,
  },
  listCount: {
    marginLeft: 'auto',
    marginTop: 8,
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

  // Location atlas
  atlasCard: {
    marginHorizontal: spacing.xl,
    marginBottom: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  atlasHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  atlasKicker: {
    fontFamily: typography.geo.semiBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.sand,
  },
  atlasTitle: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.black,
    marginTop: 2,
  },
  atlasCount: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: colors.gray,
    marginTop: 2,
  },
  atlasMap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#151412',
  },
  locationPillRow: {
    gap: 6,
    paddingTop: 10,
  },
  locationPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.ghost,
  },
  locationPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  locationPillText: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.gray,
  },
  locationPillTextActive: {
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
  thumbShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
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
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },
  locationMeta: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.grayLight,
  },
  locationValue: {
    flex: 1,
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.gray,
  },
  matchHint: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(50,105,85,0.1)',
    marginBottom: 8,
  },
  matchHintText: {
    fontFamily: typography.body.medium,
    fontSize: 10,
    color: colors.success,
  },
  contactHint: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(139,115,85,0.1)',
    marginBottom: 8,
  },
  contactHintText: {
    fontFamily: typography.body.medium,
    fontSize: 10,
    color: colors.sand,
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
    paddingVertical: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.black,
  },
  btnAlignText: {
    fontFamily: typography.body.semiBold,
    fontSize: 11,
    color: colors.bone,
  },
  btnEmail: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(139,115,85,0.25)',
  },
  btnEmailText: {
    fontFamily: typography.body.semiBold,
    fontSize: 11,
    color: colors.sand,
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
