import React, { useMemo, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors, radius, spacing, typography } from '@/lib/theme';
import {
  formatPulseDate,
  getPulseBadgeLabel,
  getPulseCategoryLabel,
  getPulseExcerpt,
} from '@/lib/pulse';
import type { PulseEdition } from '@/types/database';

interface PulseHeroCarouselProps {
  onPressStory: (story: PulseEdition) => void;
  stories: PulseEdition[];
}

const HERO_GRADIENTS: Array<[string, string, string]> = [
  ['#1A1510', colors.black, '#14100C'],
  ['#10141E', '#0A0E16', '#141A26'],
];

export function PulseHeroCarousel({
  onPressStory,
  stories,
}: PulseHeroCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidth = useMemo(() => Math.min(width - spacing.xl * 2, 390), [width]);
  const snapInterval = cardWidth + 14;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    setActiveIndex(Math.max(0, Math.min(nextIndex, stories.length - 1)));
  };

  if (!stories.length) {
    return null;
  }

  return (
    <View>
      <FlatList
        data={stories}
        horizontal
        keyExtractor={(item) => String(item.id)}
        onMomentumScrollEnd={handleMomentumEnd}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => {
          const gradient = HERO_GRADIENTS[index % HERO_GRADIENTS.length];
          const excerpt = getPulseExcerpt(item);

          return (
            <Pressable
              onPress={() => onPressStory(item)}
              style={({ pressed }) => [styles.card, { width: cardWidth }, pressed ? styles.cardPressed : null]}
              accessibilityRole="button"
              accessibilityLabel={`Open article: ${item.headline}`}
            >
              <LinearGradient colors={gradient} style={StyleSheet.absoluteFillObject} />
              {item.hero_image_path ? (
                <Image
                  source={{ uri: item.hero_image_path }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : null}
              <View style={styles.imageVeil} />
              <View style={styles.grain} />
              <View style={styles.glow} />
              <View style={styles.bottomLine} />

              <View style={styles.content}>
                <Text style={styles.badge}>{getPulseBadgeLabel(index)}</Text>

                <View style={styles.copy}>
                  <Text style={styles.category}>{getPulseCategoryLabel(item)}</Text>
                  <Text style={styles.title}>{item.headline}</Text>
                  {excerpt ? (
                    <Text style={styles.excerpt} numberOfLines={3}>
                      {excerpt}
                    </Text>
                  ) : null}
                  <View style={styles.footer}>
                    <Text style={styles.date}>{formatPulseDate(item.publish_date)}</Text>
                    <Text style={styles.readMore}>Read →</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {stories.length > 1 ? (
        <View style={styles.pagination}>
          {stories.map((story, index) => (
            <View
              key={story.id}
              style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.xl,
  },
  separator: {
    width: 14,
  },
  card: {
    minHeight: 320,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  imageVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
    opacity: 0.5,
  },
  glow: {
    position: 'absolute',
    top: -50,
    right: -25,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(201,169,98,0.08)',
  },
  bottomLine: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(201,169,98,0.18)',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.15)',
    backgroundColor: 'rgba(201,169,98,0.10)',
    fontFamily: typography.mono.medium,
    fontSize: 8,
    color: colors.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  copy: {
    marginTop: 40,
  },
  category: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.white,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  excerpt: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
  },
  readMore: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.gold,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 18,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.gold,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
});
