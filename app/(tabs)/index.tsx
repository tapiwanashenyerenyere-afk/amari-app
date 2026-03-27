import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CardPopupModal, EmblemFooter } from '@/components/v2';
import { BreathingDot } from '@/components/v2/BreathingDot';
import {
  PulseArticleModal,
  PulseBridgeTiles,
  PulseHeroCarousel,
} from '@/components/pulse';
import { useEvents } from '@/queries/events';
import { useMyProfile } from '@/queries/members';
import { usePulseFeed, usePulseMapSummary } from '@/queries/pulse';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, TIER_DISPLAY_NAMES, typography } from '@/lib/theme';
import {
  formatPulseDate,
  getPulseCategoryLabel,
  getPulseExcerpt,
  getPulseMatchFooter,
} from '@/lib/pulse';
import type { PulseEdition } from '@/types/database';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'AM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function FeedRow({
  article,
  onPress,
}: {
  article: PulseEdition;
  onPress: () => void;
}) {
  const excerpt = getPulseExcerpt(article);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.feedRow, pressed ? styles.feedRowPressed : null]}>
      <View style={styles.feedInfo}>
        <Text style={styles.feedCategory}>{getPulseCategoryLabel(article)}</Text>
        <Text style={styles.feedTitle}>{article.headline}</Text>
        {excerpt ? (
          <Text style={styles.feedDescription} numberOfLines={2}>
            {excerpt}
          </Text>
        ) : null}
        <Text style={styles.feedDate}>{formatPulseDate(article.publish_date)}</Text>
      </View>

      <View style={styles.feedThumb}>
        {article.hero_image_path ? (
          <Image source={{ uri: article.hero_image_path }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : (
          <Text style={styles.feedThumbLetter}>{article.headline.slice(0, 1).toUpperCase()}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, tier } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: pulseStories = [] } = usePulseFeed(8);
  const { data: upcomingEvents = [] } = useEvents({ scope: 'upcoming' });
  const { data: mapSummary = { total: 0, newThisWeek: 0 } } = usePulseMapSummary();

  const [cardOpen, setCardOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<PulseEdition | null>(null);

  const fullName = profile?.full_name?.trim() || 'AMARI Member';
  const firstName = fullName.split(/\s+/)[0] || 'there';
  const initials = getInitials(fullName);
  const locationLabel = profile?.city?.trim() || 'Australia';
  const displayId = profile?.display_id || `AMARI-${new Date().getFullYear()}-0000`;
  const tierLabel = TIER_DISPLAY_NAMES[tier] || tier.toUpperCase();
  const matchFooter = getPulseMatchFooter(profile);

  const heroStories = pulseStories.slice(0, 2);
  const feedStories = pulseStories.slice(2);
  const archiveTarget = pulseStories[pulseStories.length - 1] ?? null;
  const nextEvent = upcomingEvents[0] ?? null;

  const openArticle = (article: PulseEdition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedArticle(article);
  };

  const openCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCardOpen(true);
  };

  const closeCard = () => {
    Haptics.selectionAsync();
    setCardOpen(false);
  };

  const closeArticle = () => {
    Haptics.selectionAsync();
    setSelectedArticle(null);
  };

  const openEvents = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/events');
  };

  const openMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/aligned');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.greeting}>{`${getGreeting()}, ${firstName}`}</Text>

          <Pressable onPress={openCard} style={({ pressed }) => [styles.cardButton, pressed ? styles.cardButtonPressed : null]}>
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>{initials}</Text>
            </View>
            <Text style={styles.cardButtonText}>My Card</Text>
            <BreathingDot size={6} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
        </View>

        {heroStories.length ? (
          <PulseHeroCarousel onPressStory={openArticle} stories={heroStories} />
        ) : (
          <View style={styles.emptyHero}>
            <Text style={styles.emptyHeroTitle}>The next Pulse edition is warming up.</Text>
            <Text style={styles.emptyHeroText}>
              Published stories will appear here once the editorial desk sends them live.
            </Text>
          </View>
        )}

        <PulseBridgeTiles
          mapSummary={mapSummary}
          nextEvent={nextEvent}
          onOpenEvents={openEvents}
          onOpenMap={openMap}
        />

        <View style={styles.feedHeader}>
          <Text style={styles.feedHeaderTitle}>The Pulse</Text>
          <Pressable
            disabled={!archiveTarget}
            onPress={() => archiveTarget && openArticle(archiveTarget)}
            style={({ pressed }) => [
              styles.archiveButton,
              !archiveTarget ? styles.archiveButtonDisabled : null,
              pressed && archiveTarget ? styles.archiveButtonPressed : null,
            ]}
          >
            <Text style={styles.archiveButtonText}>Archive →</Text>
          </Pressable>
        </View>

        <View style={styles.feedList}>
          {feedStories.length ? (
            feedStories.map((article) => (
              <FeedRow article={article} key={article.id} onPress={() => openArticle(article)} />
            ))
          ) : (
            <Text style={styles.feedEmpty}>
              Archived editions will collect here once more Pulse stories are published.
            </Text>
          )}
        </View>

        <EmblemFooter />
      </ScrollView>

      <CardPopupModal
        visible={cardOpen}
        onClose={closeCard}
        fullName={fullName}
        city={locationLabel}
        tierLabel={tierLabel}
        displayId={displayId}
        memberUuid={user?.id || profile?.id || ''}
      />

      <PulseArticleModal
        article={selectedArticle}
        matchFooter={matchFooter}
        onClose={closeArticle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 108,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 4,
  },
  greeting: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.42)',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.cardBase,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  cardAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  cardAvatarText: {
    fontFamily: typography.body.bold,
    fontSize: 10,
    color: colors.black,
  },
  cardButtonText: {
    fontFamily: typography.body.semiBold,
    fontSize: 11,
    color: colors.white,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 6,
    paddingBottom: 18,
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 32,
    color: colors.black,
    letterSpacing: -0.5,
  },
  emptyHero: {
    minHeight: 240,
    marginHorizontal: spacing.xl,
    marginBottom: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.cardBase,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHeroTitle: {
    fontFamily: typography.body.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyHeroText: {
    marginTop: 10,
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.58)',
    textAlign: 'center',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
  },
  feedHeaderTitle: {
    fontFamily: typography.body.bold,
    fontSize: 18,
    color: colors.black,
    letterSpacing: -0.3,
  },
  archiveButton: {
    paddingVertical: 4,
  },
  archiveButtonDisabled: {
    opacity: 0.45,
  },
  archiveButtonPressed: {
    opacity: 0.7,
  },
  archiveButtonText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.goldDark,
  },
  feedList: {
    paddingBottom: 8,
  },
  feedRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: spacing.xl,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  feedRowPressed: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  feedInfo: {
    flex: 1,
  },
  feedCategory: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: 'rgba(0,0,0,0.30)',
    letterSpacing: 1.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  feedTitle: {
    fontFamily: typography.body.bold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.black,
    marginBottom: 4,
  },
  feedDescription: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(0,0,0,0.45)',
  },
  feedDate: {
    marginTop: 6,
    fontFamily: typography.mono.regular,
    fontSize: 9,
    color: 'rgba(0,0,0,0.25)',
  },
  feedThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.cardBase,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedThumbLetter: {
    fontFamily: typography.body.bold,
    fontSize: 28,
    color: 'rgba(255,255,255,0.08)',
  },
  feedEmpty: {
    paddingHorizontal: spacing.xl,
    paddingTop: 6,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
  },
});
