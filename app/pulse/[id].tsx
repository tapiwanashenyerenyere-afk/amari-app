import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEditorialStory } from '@/data/editorialStories';
import { useAuth } from '@/providers/AuthProvider';
import { usePulseEdition } from '@/queries/pulse';
import { colors, radius, spacing, typography } from '@/lib/theme';

function extractBlocks(content: unknown): string[] {
  if (typeof content === 'string') {
    return content.trim() ? [content.trim()] : [];
  }

  if (
    typeof content === 'object' &&
    content !== null &&
    'blocks' in content &&
    Array.isArray((content as { blocks?: unknown[] }).blocks)
  ) {
    return (content as { blocks: Array<{ content?: string | null }> }).blocks
      .map((block) => block.content?.trim())
      .filter((block): block is string => !!block);
  }

  return [];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PulseEditionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { tier } = useAuth();
  const routeId = typeof params.id === 'string' ? params.id : '';
  const editorialStory = routeId ? getEditorialStory(routeId) : null;
  const pulseId = Number(routeId);
  const hasFullEditorial = tier === 'platinum' || tier === 'laureate';
  const { data, isLoading, isError } = usePulseEdition(
    !editorialStory && Number.isFinite(pulseId) ? pulseId : 0,
  );

  if (editorialStory) {
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

          <Text style={styles.eyebrow}>The Pulse</Text>
          <Text style={styles.category}>{editorialStory.category}</Text>
          <Text style={styles.headline}>{editorialStory.headline}</Text>
          <Text style={styles.meta}>{formatDate(editorialStory.publishedAt)}</Text>

          <View style={styles.imageWrap}>
            {editorialStory.image ? (
              <Image source={editorialStory.image} style={styles.heroImage} contentFit="cover" transition={300} />
            ) : (
              <LinearGradient
                colors={['#F0ECE5', '#E4D9CA']}
                style={styles.heroImage}
              />
            )}
          </View>
          {editorialStory.imageCredit ? (
            <Text style={styles.credit}>Image: {editorialStory.imageCredit}</Text>
          ) : null}

          {editorialStory.amariConnection ? (
            <View style={styles.connectionCard}>
              <Text style={styles.connectionLabel}>AMARI Connection</Text>
              <Text style={styles.connectionBody}>{editorialStory.amariConnection}</Text>
            </View>
          ) : null}

          <View style={styles.bodyCard}>
            {editorialStory.body.map((block, index) => (
              <Text key={`${editorialStory.id}-${index}`} style={styles.bodyText}>
                {block}
              </Text>
            ))}
          </View>

          <View style={styles.sourcesCard}>
            <Text style={styles.sourcesTitle}>Sources</Text>
            {editorialStory.sources.map((source, index) => (
              <Pressable
                key={`${source.url}-${index}`}
                style={[styles.sourceRow, index === editorialStory.sources.length - 1 && styles.sourceRowLast]}
                onPress={() => Linking.openURL(source.url)}
                accessibilityRole="button"
                accessibilityLabel={`Open source: ${source.label}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.sourceLabel}>{source.label}</Text>
                  <Text style={styles.sourceUrl} numberOfLines={1}>{source.url}</Text>
                </View>
                <Text style={styles.sourceArrow}>Open</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!Number.isFinite(pulseId)) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Pulse</Text>
        <Text style={styles.errorBody}>This editorial link is invalid.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="small" color={colors.sand} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Pulse</Text>
        <Text style={styles.errorBody}>This edition is not available right now.</Text>
      </View>
    );
  }

  const summaryBlocks = extractBlocks(data.summary_content);
  const fullBlocks = extractBlocks(data.full_content);
  const contentBlocks = fullBlocks.length > 0 ? fullBlocks : summaryBlocks;
  const publishDate = data.publish_date ? formatDate(data.publish_date) : null;

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

        <Text style={styles.eyebrow}>The Pulse</Text>
        <Text style={styles.headline}>{data.headline}</Text>
        {publishDate ? <Text style={styles.meta}>{publishDate}</Text> : null}

        {contentBlocks.length > 0 ? (
          <View style={styles.bodyCard}>
            {contentBlocks.map((block, index) => (
              <Text key={`${index}-${block.slice(0, 12)}`} style={styles.bodyText}>
                {block}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.bodyCard}>
            <Text style={styles.bodyText}>This edition has been published without body copy.</Text>
          </View>
        )}

        {!hasFullEditorial ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Summary access</Text>
            <Text style={styles.noticeBody}>
              Full Pulse editorials are available from Platinum membership. Your current view shows the published summary only.
            </Text>
          </View>
        ) : null}
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
  centered: {
    flex: 1,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
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
  category: {
    fontFamily: typography.geo.semiBold,
    fontSize: 11,
    color: colors.gray,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: typography.serif.medium,
    fontSize: 32,
    color: colors.black,
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  meta: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
    marginBottom: spacing.lg,
  },
  imageWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  credit: {
    fontFamily: typography.body.regular,
    fontSize: 10,
    color: colors.gray,
    marginBottom: spacing.lg,
  },
  connectionCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.black,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  connectionLabel: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: colors.sandOnDark,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  connectionBody: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    color: colors.white,
    lineHeight: 20,
  },
  bodyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  bodyText: {
    fontFamily: typography.body.regular,
    fontSize: 15,
    color: colors.black,
    lineHeight: 26,
  },
  sourcesCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  sourcesTitle: {
    fontFamily: typography.geo.semiBold,
    fontSize: 12,
    color: colors.black,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  sourceRowLast: {
    borderBottomWidth: 0,
  },
  sourceLabel: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.black,
    marginBottom: 2,
  },
  sourceUrl: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
  },
  sourceArrow: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.sand,
  },
  noticeCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.black,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  noticeTitle: {
    fontFamily: typography.geo.medium,
    fontSize: 11,
    color: colors.sandOnDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  noticeBody: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 19,
  },
  errorTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  errorBody: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
  },
});
