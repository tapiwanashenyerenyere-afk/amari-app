import React from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius, TIER_LEVELS } from '../../../lib/theme';
import { StaggerReveal, SectionLabel } from '../../../components/v2';
import { useAlignedConnections } from '../../../queries/aligned';
import { useAuth } from '../../../providers/AuthProvider';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getConnectionColor(tier: string) {
  switch (tier) {
    case 'laureate':
      return colors.sandOnDark;
    case 'platinum':
      return colors.tierPlatinum;
    case 'silver':
      return colors.tierSilver;
    default:
      return colors.gray;
  }
}

function formatTimeAgo(timestamp: string) {
  const elapsed = Date.now() - new Date(timestamp).getTime();
  const days = Math.max(0, Math.floor(elapsed / (1000 * 60 * 60 * 24)));

  if (days === 0) {
    return 'today';
  }

  if (days === 1) {
    return '1 day ago';
  }

  return `${days} days ago`;
}

// ─── Entry Card Component ───────────────────────────────
function EntryCard({
  tag,
  title,
  subtitle,
  gradientColors,
  glowColor,
  glowPosition,
  onPress,
  delay,
}: {
  tag: string;
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string, string];
  glowColor: string;
  glowPosition: { x: number; y: number };
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(600).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={styles.entryCard}
        accessibilityRole="button"
        accessibilityLabel={title + '. ' + subtitle}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Radial glow accent */}
        <View
          style={[
            styles.glow,
            {
              left: glowPosition.x as number,
              top: glowPosition.y as number,
              backgroundColor: glowColor,
            },
          ]}
        />
        {/* Overlay gradient for text legibility */}
        <LinearGradient
          colors={[
            'rgba(17,17,17,0.1)',
            'rgba(17,17,17,0.35)',
            'rgba(17,17,17,0.85)',
          ]}
          style={StyleSheet.absoluteFill}
        />
        {/* Geometric accent — ring */}
        <View style={styles.geoRing} />
        {/* Arrow button */}
        <View style={styles.entryArrow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.arrowText}>{'\u2192'}</Text>
        </View>
        {/* Content */}
        <View style={styles.entryContent}>
          <Text style={styles.entryTag}>{tag}</Text>
          <Text style={styles.entryTitle}>{title}</Text>
          <Text style={styles.entrySubtitle}>{subtitle}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Connection Row ─────────────────────────────────────
function ConnectionRow({
  name,
  initials,
  color,
  via,
  timeAgo,
}: {
  name: string;
  initials: string;
  color: string;
  via: string;
  timeAgo: string;
}) {
  return (
    <View style={styles.connRow}>
      <View style={[styles.connAvatar, { backgroundColor: color }]}>
        <Text style={styles.connInitials}>{initials}</Text>
      </View>
      <View style={styles.connInfo}>
        <Text style={styles.connName}>{name}</Text>
        <Text style={styles.connSub}>
          Connected {timeAgo} via {via}
        </Text>
      </View>
      <View style={styles.connBadge}>
        <Text style={styles.connBadgeText}>Mutual</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────
export default function AlignedLanding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tier } = useAuth();
  const { data: connections = [] } = useAlignedConnections();
  const canCreate = (TIER_LEVELS[tier as keyof typeof TIER_LEVELS] ?? 0) >= TIER_LEVELS.silver;

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
            <Text style={styles.title}>Aligned</Text>
            <Text style={styles.subtitle}>
              Connect through work and shared interests. Tap a category to
              explore.
            </Text>
          </View>
        </StaggerReveal>

        {/* Entry Cards */}
        <View style={styles.entrySection}>
          <EntryCard
            tag="See what people are building"
            title="Projects"
            subtitle="Anonymous project tiles ranked by skill alignment"
            gradientColors={['#1C1815', '#111111', '#14120F']}
            glowColor="rgba(196, 168, 130, 0.14)"
            glowPosition={{ x: 130, y: 70 }}
            onPress={() => router.push('/(tabs)/aligned/projects')}
            delay={100}
          />
          <EntryCard
            tag="Discover shared passions"
            title="Interests"
            subtitle="People who care about the same things you do"
            gradientColors={['#151618', '#111111', '#111114']}
            glowColor="rgba(196, 168, 130, 0.08)"
            glowPosition={{ x: 70, y: 100 }}
            onPress={() => router.push('/(tabs)/aligned/interests')}
            delay={250}
          />
        </View>

        {/* Create tile CTA */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600).springify()}
        >
          <Pressable
            style={styles.createBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (canCreate) {
                router.push('/(tabs)/aligned/create');
              } else {
                Alert.alert('Publishing opens from Silver membership', 'You can explore Aligned on your current membership, but publishing a tile requires Silver, Platinum, or Laureate access.');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={canCreate ? 'Add your tile' : 'Aligned publishing opens from Silver membership'}
          >
            <Text style={styles.createBtnPlus}>+</Text>
            <View>
              <Text style={styles.createBtnTitle}>{canCreate ? 'Add your tile' : 'Browse only on Member'}</Text>
              <Text style={styles.createBtnSub}>
                {canCreate
                  ? 'Share a project or interest for others to discover'
                  : 'Publishing opens from Silver membership and above'}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Recent Connections */}
        <View style={styles.recentSection}>
          <SectionLabel>Recent connections</SectionLabel>
          {connections.length > 0 ? (
            connections.map((connection) => (
              <ConnectionRow
                key={connection.id}
                name={connection.full_name}
                initials={getInitials(connection.full_name)}
                color={getConnectionColor(connection.tier)}
                via={connection.matched_via}
                timeAgo={formatTimeAgo(connection.connected_at)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              Your connections will appear here as the network grows.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },

  // Header
  header: { paddingHorizontal: spacing.xl, paddingTop: 8, marginBottom: 4 },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 32,
    fontStyle: 'italic',
    color: colors.black,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    lineHeight: 20,
    marginTop: 4,
  },

  // Entry cards
  entrySection: { paddingHorizontal: spacing.xl, paddingTop: 24, gap: 14 },
  entryCard: {
    height: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 1,
  },
  geoRing: {
    position: 'absolute',
    top: 20,
    right: 70,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  entryArrow: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  arrowText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  entryContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 22,
    zIndex: 2,
  },
  entryTag: {
    fontFamily: typography.geo.semiBold,
    fontSize: typography.sizes.caption,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.sandOnDark,
    marginBottom: 6,
  },
  entryTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 26,
    color: colors.white,
    lineHeight: 30,
    marginBottom: 4,
  },
  entrySubtitle: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },

  // Create tile CTA
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: spacing.xl,
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    borderStyle: 'dashed',
  },
  createBtnPlus: {
    fontFamily: typography.body.regular,
    fontSize: 22,
    color: colors.sand,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ghost,
    textAlign: 'center',
    lineHeight: 34,
  },
  createBtnTitle: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.black,
  },
  createBtnSub: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },

  // Recent connections
  recentSection: { paddingTop: 24 },
  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  connAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connInitials: {
    fontFamily: typography.geo.bold,
    fontSize: 11,
    color: colors.bone,
  },
  connInfo: { flex: 1 },
  connName: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.black,
  },
  connSub: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
    marginTop: 1,
  },
  connBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.badgeGreen,
  },
  connBadgeText: {
    fontFamily: typography.body.semiBold,
    fontSize: typography.sizes.caption,
    color: colors.badgeGreenText,
  },
  emptyText: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: spacing.xl,
  },
});
