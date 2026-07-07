import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Bookmark, Headphones, Play } from 'lucide-react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { feedTagLabel } from '@/constants/feedTags';
import { formatLabel } from '@/lib/contentMeta';
import { recordNewsEvent } from '@/lib/newsEvents';
import type { NewsFeedItem } from '@/types/database';

// Shared, format-aware feed row — used by the home briefing preview and the
// full briefing screen. Renders article / video / audio with the right badge
// and an optional "why you're seeing this" reason line.
export function ArticleRow({
  article,
  reason,
  onOpen,
  onToggleSave,
}: {
  article: NewsFeedItem;
  reason?: string;
  onOpen: (article: NewsFeedItem) => void;
  onToggleSave: (article: NewsFeedItem) => void;
}) {
  useEffect(() => {
    recordNewsEvent(article.id, 'impression');
  }, [article.id]);

  const description = article.summary ?? article.snippet;
  const primaryTag = article.topics[0] ? feedTagLabel(article.topics[0]) : null;
  const isVideo = article.media_type === 'video';
  const isAudio = article.media_type === 'audio';

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
        {reason ? <Text style={styles.rowReason}>{reason}</Text> : null}
        <View style={styles.rowFooter}>
          <Text style={styles.rowTime}>{formatLabel(article)}</Text>
          <Pressable hitSlop={10} onPress={() => onToggleSave(article)} style={styles.saveButton}>
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
          <Image contentFit="cover" source={{ uri: article.image_url }} style={StyleSheet.absoluteFillObject} />
          {isVideo || isAudio ? (
            <View style={styles.mediaBadge}>
              {isVideo ? (
                <Play color={colors.white} fill={colors.white} size={13} />
              ) : (
                <Headphones color={colors.white} size={13} strokeWidth={2} />
              )}
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: spacing.xl,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowPressed: { backgroundColor: 'rgba(0,0,0,0.02)' },
  rowInfo: { flex: 1 },
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
  rowReason: {
    marginTop: 6,
    fontFamily: typography.body.medium,
    fontSize: 10.5,
    color: colors.sand,
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
  saveButton: { paddingLeft: 12 },
  rowThumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: colors.warm,
    overflow: 'hidden',
  },
  mediaBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(10,10,10,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
