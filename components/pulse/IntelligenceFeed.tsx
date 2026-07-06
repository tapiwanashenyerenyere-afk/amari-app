import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Bookmark } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { feedTagLabel } from '@/constants/feedTags';
import { recordNewsEvent, flushNewsEvents } from '@/lib/newsEvents';
import {
  useFeedInterests,
  useNewsFeed,
  useToggleSavedArticle,
} from '@/queries/news';
import { InterestSheet } from './InterestSheet';
import type { NewsFeedItem } from '@/types/database';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ArticleRow({
  article,
  onOpen,
  onToggleSave,
}: {
  article: NewsFeedItem;
  onOpen: (article: NewsFeedItem) => void;
  onToggleSave: (article: NewsFeedItem) => void;
}) {
  useEffect(() => {
    recordNewsEvent(article.id, 'impression');
  }, [article.id]);

  const description = article.summary ?? article.snippet;
  const primaryTag = article.topics[0] ? feedTagLabel(article.topics[0]) : null;

  return (
    <Pressable
      onPress={() => onOpen(article)}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.rowSource}>
          {article.source_name.toUpperCase()}
          {primaryTag ? `  ·  ${primaryTag.toUpperCase()}` : ''}
        </Text>
        <Text numberOfLines={3} style={styles.rowTitle}>
          {article.title}
        </Text>
        {description ? (
          <Text numberOfLines={2} style={styles.rowDescription}>
            {description}
          </Text>
        ) : null}
        <View style={styles.rowFooter}>
          <Text style={styles.rowTime}>{timeAgo(article.published_at)}</Text>
          <Pressable
            hitSlop={10}
            onPress={() => onToggleSave(article)}
            style={styles.saveButton}
          >
            <Bookmark
              color={article.is_saved ? colors.goldDark : 'rgba(0,0,0,0.28)'}
              fill={article.is_saved ? colors.goldDark : 'transparent'}
              size={15}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>

      {article.image_url ? (
        <View style={styles.rowThumb}>
          <Image
            contentFit="cover"
            source={{ uri: article.image_url }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

export function IntelligenceFeed() {
  const [interestsOpen, setInterestsOpen] = useState(false);
  const { data: interests = [], isLoading: interestsLoading } = useFeedInterests();
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNewsFeed();
  const toggleSaved = useToggleSavedArticle();

  const articles = useMemo(
    () => (data?.pages ?? []).flat(),
    [data],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        flushNewsEvents();
      }
    });
    return () => {
      subscription.remove();
      flushNewsEvents();
    };
  }, []);

  const openArticle = async (article: NewsFeedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    recordNewsEvent(article.id, 'open');
    const openedAt = Date.now();
    await WebBrowser.openBrowserAsync(article.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
    recordNewsEvent(article.id, 'dwell', Date.now() - openedAt);
  };

  const handleToggleSave = (article: NewsFeedItem) => {
    Haptics.selectionAsync();
    toggleSaved.mutate(article.id);
  };

  const openInterests = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterestsOpen(true);
  };

  const showFirstRunPrompt =
    !interestsLoading && interests.length === 0 && articles.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Intelligence</Text>
        <Pressable
          onPress={openInterests}
          style={({ pressed }) => [pressed ? styles.tunePressed : null]}
        >
          <Text style={styles.tuneText}>Tune →</Text>
        </Pressable>
      </View>

      {showFirstRunPrompt ? (
        <Pressable onPress={openInterests} style={({ pressed }) => [styles.prompt, pressed ? styles.promptPressed : null]}>
          <Text style={styles.promptTitle}>Make this feed yours</Text>
          <Text style={styles.promptText}>
            Choose the sectors and regions you care about, and the briefing sharpens around them.
          </Text>
          <Text style={styles.promptCta}>Choose interests →</Text>
        </Pressable>
      ) : null}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.sand} />
        </View>
      ) : articles.length ? (
        <View>
          {articles.map((article) => (
            <ArticleRow
              article={article}
              key={article.id}
              onOpen={openArticle}
              onToggleSave={handleToggleSave}
            />
          ))}

          {hasNextPage ? (
            <Pressable
              disabled={isFetchingNextPage}
              onPress={() => fetchNextPage()}
              style={({ pressed }) => [styles.moreButton, pressed ? styles.morePressed : null]}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator color={colors.sand} size="small" />
              ) : (
                <Text style={styles.moreText}>More briefings</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>The briefing desk is warming up.</Text>
          <Text style={styles.emptyText}>
            Curated diaspora business and industry coverage will land here as sources come online.
          </Text>
        </View>
      )}

      <InterestSheet
        onClose={() => setInterestsOpen(false)}
        visible={interestsOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 26,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
  },
  headerTitle: {
    fontFamily: typography.body.bold,
    fontSize: 18,
    color: colors.black,
    letterSpacing: -0.3,
  },
  tunePressed: {
    opacity: 0.7,
  },
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
  promptPressed: {
    opacity: 0.92,
  },
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
  loading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: spacing.xl,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowPressed: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  rowInfo: {
    flex: 1,
  },
  rowSource: {
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: 'rgba(0,0,0,0.30)',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  rowTitle: {
    fontFamily: typography.body.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.black,
    marginBottom: 4,
  },
  rowDescription: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(0,0,0,0.45)',
  },
  rowFooter: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTime: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    color: 'rgba(0,0,0,0.25)',
  },
  saveButton: {
    paddingLeft: 12,
  },
  rowThumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: colors.warm,
    overflow: 'hidden',
  },
  moreButton: {
    marginHorizontal: spacing.xl,
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
  },
  morePressed: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  moreText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
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
