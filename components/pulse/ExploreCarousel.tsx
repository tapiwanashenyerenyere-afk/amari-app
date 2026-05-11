import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../lib/theme';
import {
  computeSnapOffsets,
  getItemWidth,
  TILE_GAP,
  TILE_HEIGHT,
  TILE_LARGE_WIDTH,
} from '../../constants/explore';
import type { ExploreTile as ExploreTileData } from '../../types/explore';
import { ExploreTile } from './ExploreTile';

interface ExploreCarouselProps {
  tiles: ExploreTileData[];
  isLoading: boolean;
}

export function ExploreCarousel({ tiles, isLoading }: ExploreCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<ExploreTileData>>(null);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPlaceholder}>
          <ActivityIndicator size="small" color={colors.sandOnDark} />
        </View>
      </View>
    );
  }

  if (tiles.length === 0) {
    return null;
  }

  const snapOffsets = computeSnapOffsets(tiles.length);

  const renderItem = ({ item, index }: { item: ExploreTileData; index: number }) => (
    <ExploreTile tile={item} width={getItemWidth(index)} />
  );

  const renderSeparator = () => <View style={styles.separator} />;

  const keyExtractor = (item: ExploreTileData) => item.id;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={tiles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        decelerationRate={Platform.OS === 'ios' ? 0.992 : 'fast'}
        disableIntervalMomentum={Platform.OS === 'android'}
        contentContainerStyle={styles.contentContainer}
        ItemSeparatorComponent={renderSeparator}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {tiles.map((tile, index) => (
          <View
            key={tile.id}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingHorizontal: spacing.xl,
  },
  loadingPlaceholder: {
    width: TILE_LARGE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: radius.xl,
    backgroundColor: '#1C1815',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
  },
  separator: {
    width: TILE_GAP,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.sandOnDark,
  },
  dotInactive: {
    backgroundColor: colors.grayGhost,
  },
});
