import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ArticleRow } from '@/components/pulse/ArticleRow';
import { InterestSheet } from '@/components/pulse/InterestSheet';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { feedTagLabel } from '@/constants/feedTags';
import { reasonLabel } from '@/lib/contentMeta';
import { flushNewsEvents } from '@/lib/newsEvents';
import { useFeedInterests, useNewsFeed } from '@/queries/news';
import { useBriefingActions } from '@/hooks/useBriefingActions';
import type { NewsFeedItem } from '@/types/database';

export default function BriefingScreen() {
  const router = useRouter();
  const [interestsOpen, setInterestsOpen] = useState(false);
  const { data: interests = [] } = useFeedInterests();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useNewsFeed();
  const { openArticle, handleToggleSave } = useBriefingActions();

  const articles = useMemo(() => (data?.pages ?? []).flat(), [data]);
  const followed = useMemo(() => interests.filter((i) => i.declared), [interests]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flushNewsEvents();
    });
    return () => {
      sub.remove();
      flushNewsEvents();
    };
  }, []);

  const openInterests = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterestsOpen(true);
  };

  const renderItem = ({ item }: { item: NewsFeedItem }) => (
    <ArticleRow
      article={item}
      onOpen={openArticle}
      onToggleSave={handleToggleSave}
      reason={reasonLabel(item, interests)}
    />
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft color={colors.black} size={20} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Briefing</Text>
          <Pressable hitSlop={8} onPress={openInterests} style={styles.iconButton}>
            <SlidersHorizontal color={colors.black} size={18} strokeWidth={2} />
          </Pressable>
        </View>

        {followed.length ? (
          <FlatList
            data={followed}
            horizontal
            keyExtractor={(i) => i.tag}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            renderItem={({ item }) => (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{feedTagLabel(item.tag)}</Text>
              </View>
            )}
            ListFooterComponent={
              <Pressable onPress={openInterests} style={styles.editChip}>
                <Text style={styles.editChipText}>Edit</Text>
              </Pressable>
            }
          />
        ) : (
          <Pressable onPress={openInterests} style={styles.followPrompt}>
            <Text style={styles.followPromptText}>
              Follow the sectors and places you care about to sharpen your briefing.
            </Text>
            <Text style={styles.followPromptCta}>Choose interests →</Text>
          </Pressable>
        )}
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.sand} />
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.6}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.sand} style={styles.footerLoading} />
            ) : !hasNextPage && articles.length > 0 ? (
              // A real stopping point — no silent refill below it.
              <View style={styles.caughtUp}>
                <View style={styles.caughtUpRule} />
                <Text style={styles.caughtUpTitle}>You are caught up</Text>
                <Text style={styles.caughtUpText}>
                  That is everything on your interests for now. New coverage lands through the day.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>The briefing desk is warming up.</Text>
              <Text style={styles.emptyText}>
                Curated diaspora business and industry coverage will appear here as sources come online.
              </Text>
            </View>
          }
        />
      )}

      <InterestSheet onClose={() => setInterestsOpen(false)} visible={interestsOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 6,
    paddingBottom: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.body.bold,
    fontSize: 18,
    color: colors.black,
    letterSpacing: -0.3,
  },
  chipsRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.black,
  },
  chipText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.white,
  },
  editChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.14)',
  },
  editChipText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.black,
  },
  followPrompt: {
    marginHorizontal: spacing.xl,
    marginBottom: 12,
    borderRadius: radius.md,
    backgroundColor: colors.warm,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  followPromptText: {
    fontFamily: typography.body.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.gray,
  },
  followPromptCta: {
    marginTop: 8,
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.goldDark,
  },
  loading: { paddingVertical: 40, alignItems: 'center' },
  listContent: { paddingBottom: 60 },
  footerLoading: { paddingVertical: 24 },
  caughtUp: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 40,
  },
  caughtUpRule: {
    width: 40,
    height: 2,
    backgroundColor: colors.sand,
    marginBottom: 16,
  },
  caughtUpTitle: {
    fontFamily: typography.body.bold,
    fontSize: 15,
    color: colors.black,
    marginBottom: 6,
  },
  caughtUpText: {
    fontFamily: typography.body.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.gray,
    textAlign: 'center',
  },
  empty: {
    marginHorizontal: spacing.xl,
    marginTop: 20,
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
