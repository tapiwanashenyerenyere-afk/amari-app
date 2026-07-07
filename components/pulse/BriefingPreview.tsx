import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { reasonLabel } from '@/lib/contentMeta';
import { useFeedInterests, useNewsFeed } from '@/queries/news';
import { useBriefingActions } from '@/hooks/useBriefingActions';
import { ArticleRow } from './ArticleRow';
import { InterestSheet } from './InterestSheet';

const PREVIEW_COUNT = 4;

// The briefing on the Pulse home: a compact taste of the personalised feed
// with the Tune control right here, then a tap into the full screen. Keeps
// the home short instead of dumping the whole feed inline.
export function BriefingPreview() {
  const router = useRouter();
  const [interestsOpen, setInterestsOpen] = useState(false);
  const { data: interests = [], isLoading: interestsLoading } = useFeedInterests();
  const { data, isLoading } = useNewsFeed();
  const { openArticle, handleToggleSave } = useBriefingActions();

  const topArticles = useMemo(() => (data?.pages?.[0] ?? []).slice(0, PREVIEW_COUNT), [data]);

  const openInterests = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterestsOpen(true);
  };

  const openBriefing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/briefing');
  };

  const noInterests = !interestsLoading && interests.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ACROSS THE WORLD</Text>
          <Text style={styles.title}>Your briefing</Text>
        </View>
        <Pressable onPress={openInterests} hitSlop={8} style={({ pressed }) => [styles.tune, pressed ? styles.pressed : null]}>
          <Text style={styles.tuneText}>Tune →</Text>
        </Pressable>
      </View>

      {noInterests && topArticles.length > 0 ? (
        <Pressable onPress={openInterests} style={({ pressed }) => [styles.prompt, pressed ? styles.promptPressed : null]}>
          <Text style={styles.promptTitle}>Make this yours</Text>
          <Text style={styles.promptText}>
            Choose the sectors and places you care about, and your briefing sharpens around them.
          </Text>
          <Text style={styles.promptCta}>Choose interests →</Text>
        </Pressable>
      ) : null}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.sand} />
        </View>
      ) : topArticles.length ? (
        <View>
          {topArticles.map((article) => (
            <ArticleRow
              article={article}
              key={article.id}
              onOpen={openArticle}
              onToggleSave={handleToggleSave}
              reason={reasonLabel(article, interests)}
            />
          ))}

          <Pressable onPress={openBriefing} style={({ pressed }) => [styles.openButton, pressed ? styles.openPressed : null]}>
            <Text style={styles.openText}>Open full briefing →</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>The briefing desk is warming up.</Text>
          <Text style={styles.emptyText}>
            Curated diaspora business and industry coverage will land here as sources come online.
          </Text>
        </View>
      )}

      <InterestSheet onClose={() => setInterestsOpen(false)} visible={interestsOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 26 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
  },
  eyebrow: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: colors.sand,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 18,
    color: colors.black,
    letterSpacing: -0.3,
  },
  tune: { paddingBottom: 2 },
  pressed: { opacity: 0.6 },
  tuneText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.goldDark,
  },
  prompt: {
    marginHorizontal: spacing.xl,
    marginBottom: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.cardBase,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  promptPressed: { opacity: 0.92 },
  promptTitle: {
    fontFamily: typography.body.bold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: -0.2,
  },
  promptText: {
    marginTop: 6,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.6)',
  },
  promptCta: {
    marginTop: 12,
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.gold,
  },
  loading: { paddingVertical: 32, alignItems: 'center' },
  openButton: {
    marginHorizontal: spacing.xl,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
  },
  openPressed: { backgroundColor: 'rgba(0,0,0,0.03)' },
  openText: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.black,
  },
  empty: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.warm,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyTitle: {
    fontFamily: typography.body.bold,
    fontSize: 14,
    color: colors.black,
  },
  emptyText: {
    marginTop: 5,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
  },
});
