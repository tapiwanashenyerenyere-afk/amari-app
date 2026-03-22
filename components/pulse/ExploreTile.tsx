import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { tapHaptic } from '../../lib/haptics';
import { TILE_HEIGHT, TILE_LARGE_WIDTH } from '../../constants/explore';
import type { ExploreTile as ExploreTileType } from '../../types/explore';

interface ExploreTileProps {
  tile: ExploreTileType;
  width: number;
  onPress?: (tile: ExploreTileType) => void;
}

export function ExploreTile({ tile, width, onPress }: ExploreTileProps) {
  const isLarge = width >= TILE_LARGE_WIDTH;

  const handlePress = () => {
    tapHaptic();
    onPress?.(tile);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tile.tag_label}: ${tile.title}`}
      style={[styles.container, { width }]}
    >
      {/* Background layer */}
      {tile.image_url ? (
        <>
          <Image
            source={{ uri: tile.image_url }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </>
      ) : (
        <LinearGradient
          colors={['#1C1815', '#111111', '#14120F']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Dark overlay gradient for text legibility (bottom-heavy) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Disclosure pill */}
      {tile.disclosure_label != null && (
        <View style={styles.disclosurePill}>
          <Text style={styles.disclosureText}>{tile.disclosure_label}</Text>
        </View>
      )}

      {/* Content pinned to bottom */}
      <View style={styles.content}>
        <Text style={styles.tagLabel}>{tile.tag_label}</Text>
        <Text
          style={[styles.title, { fontSize: isLarge ? 22 : 17 }]}
          numberOfLines={3}
        >
          {tile.title}
        </Text>
        {tile.subtitle && (
          <Text
            style={[styles.subtitle, { fontSize: isLarge ? 11 : 10 }]}
            numberOfLines={1}
          >
            {tile.subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: TILE_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  disclosurePill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  disclosureText: {
    fontFamily: typography.body.medium,
    fontSize: typography.sizes.caption,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: typography.spacing.badge,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  tagLabel: {
    fontFamily: typography.geo.semiBold,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: colors.sandOnDark,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.serif.medium,
    color: colors.white,
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.body.regular,
    color: 'rgba(255,255,255,0.6)',
  },
});
