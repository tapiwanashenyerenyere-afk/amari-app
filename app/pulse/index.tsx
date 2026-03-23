import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { EDITORIAL_CATEGORIES, getEditorialStories } from '@/data/editorialStories';
import { getRecommendedEditorialLead, rankEditorialStories } from '@/lib/editorialRecommendations';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { FilterPills, WhiteCard } from '@/components/v2';
import { useMyProfile } from '@/queries/members';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PulseArchiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof EDITORIAL_CATEGORIES)[number]>('All');
  const { data: profile } = useMyProfile();
  const stories = useMemo(
    () => rankEditorialStories(profile || null, getEditorialStories()),
    [profile],
  );

  const filteredStories = useMemo(() => {
    if (filter === 'All') {
      return stories;
    }

    return stories.filter((item) => item.story.shortLabel === filter);
  }, [filter, stories]);

  const leadRecommendation = filteredStories[0] ?? null;
  const leadStory = leadRecommendation?.story ?? getRecommendedEditorialLead(profile || null)?.story ?? null;
  const archiveStories = filteredStories.slice(1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>Editorial Archive</Text>
        <Text style={styles.title}>The Pulse</Text>
        <Text style={styles.subtitle}>
          Signals, wins, movement, and cultural intelligence from across the AMARI network.
        </Text>

        <FilterPills
          options={[...EDITORIAL_CATEGORIES]}
          selected={filter}
          onSelect={(value) => setFilter(value as (typeof EDITORIAL_CATEGORIES)[number])}
        />

        {leadStory ? (
          <Pressable
            style={styles.leadCard}
            onPress={() => router.push({ pathname: '/pulse/[id]', params: { id: leadStory.slug } })}
          >
            {leadStory.image ? (
              <Image source={leadStory.image} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={300} />
            ) : (
              <LinearGradient
                colors={['#1C1815', '#111111', '#14120F']}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.leadContent}>
              <Text style={styles.leadCategory}>{leadStory.category}</Text>
              <Text style={styles.leadHeadline}>{leadStory.headline}</Text>
              <Text style={styles.leadSummary}>{leadStory.summary}</Text>
              {leadRecommendation?.reason ? (
                <Text style={styles.reason}>{leadRecommendation.reason}</Text>
              ) : null}
              {leadStory.amariConnection ? (
                <Text style={styles.connection}>{leadStory.amariConnection}</Text>
              ) : null}
              <View style={styles.leadFooter}>
                <Text style={styles.leadDate}>{formatDate(leadStory.publishedAt)}</Text>
                <Text style={styles.openLabel}>Read</Text>
              </View>
            </View>
          </Pressable>
        ) : null}

        {archiveStories.map(({ story, reason }) => (
          <WhiteCard
            key={story.id}
            onPress={() => router.push({ pathname: '/pulse/[id]', params: { id: story.slug } })}
            static
          >
            <View style={styles.archiveRow}>
              <View style={styles.archiveCopy}>
                <Text style={styles.archiveCategory}>{story.shortLabel}</Text>
                <Text style={styles.archiveHeadline}>{story.headline}</Text>
                <Text style={styles.archiveSummary} numberOfLines={3}>
                  {story.summary}
                </Text>
                <Text style={styles.archiveReason} numberOfLines={1}>
                  {reason}
                </Text>
                <Text style={styles.archiveDate}>{formatDate(story.publishedAt)}</Text>
              </View>
              <View style={styles.archiveThumbWrap}>
                {story.image ? (
                  <Image source={story.image} style={styles.archiveThumb} contentFit="cover" transition={200} />
                ) : (
                  <LinearGradient
                    colors={['#F0ECE5', '#E4D9CA']}
                    style={styles.archiveThumb}
                  />
                )}
              </View>
            </View>
          </WhiteCard>
        ))}
      </ScrollView>
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
    padding: spacing.xl,
    paddingBottom: 88,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  backText: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    color: colors.sand,
  },
  eyebrow: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 2,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 34,
    color: colors.black,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  leadCard: {
    minHeight: 360,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  leadContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 22,
  },
  leadCategory: {
    fontFamily: typography.geo.semiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.74)',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
  },
  leadHeadline: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    color: colors.white,
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  leadSummary: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  reason: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: spacing.sm,
  },
  connection: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.sandOnDark,
    marginBottom: spacing.sm,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadDate: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
  },
  openLabel: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.sandOnDark,
  },
  archiveRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  archiveCopy: {
    flex: 1,
  },
  archiveCategory: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  archiveHeadline: {
    fontFamily: typography.geo.semiBold,
    fontSize: 16,
    color: colors.black,
    lineHeight: 22,
    marginBottom: 6,
  },
  archiveSummary: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    lineHeight: 18,
    marginBottom: 8,
  },
  archiveReason: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.sand,
    marginBottom: 6,
  },
  archiveDate: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.sand,
  },
  archiveThumbWrap: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.ghost,
  },
  archiveThumb: {
    width: '100%',
    height: '100%',
  },
});
