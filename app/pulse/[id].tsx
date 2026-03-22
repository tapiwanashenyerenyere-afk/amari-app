import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function PulseEditionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { tier } = useAuth();
  const pulseId = Number(params.id);
  const { data, isLoading, isError } = usePulseEdition(Number.isFinite(pulseId) ? pulseId : 0);
  const hasFullEditorial = tier === 'platinum' || tier === 'laureate';

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
  const publishDate = data.publish_date
    ? new Date(data.publish_date).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

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
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
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
    marginBottom: spacing.xl,
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
