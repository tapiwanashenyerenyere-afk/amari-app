import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, typography } from '@/lib/theme';

interface ProfileTabSwitcherProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  maxWidth?: number;
}

interface TabLayout {
  x: number;
  width: number;
}

export function ProfileTabSwitcher({
  tabs,
  activeIndex,
  onChange,
  maxWidth,
}: ProfileTabSwitcherProps) {
  const [layouts, setLayouts] = useState<Record<number, TabLayout>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  useEffect(() => {
    const layout = layouts[activeIndex];
    if (!layout) {
      return;
    }

    indicatorX.value = withSpring(layout.x, { damping: 16, stiffness: 180 });
    indicatorWidth.value = withSpring(layout.width, { damping: 16, stiffness: 180 });
  }, [activeIndex, indicatorWidth, indicatorX, layouts]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const updateLayout = (index: number, event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout;
    setLayouts((current) => ({
      ...current,
      [index]: { x: next.x, width: next.width },
    }));
  };

  const dots = useMemo(
    () =>
      tabs.map((_, index) => (
        <View
          key={`dot-${index}`}
          style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
        />
      )),
    [activeIndex, tabs]
  );

  return (
    <View style={[styles.wrap, maxWidth ? { maxWidth } : null]}>
      <View style={styles.tabRow}>
        {tabs.map((tab, index) => (
          <Pressable
            key={tab}
            onLayout={(event) => updateLayout(index, event)}
            onPress={() => onChange(index)}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel={`Show ${tab}`}
            accessibilityState={{ selected: index === activeIndex }}
          >
            <Text style={[styles.tabLabel, index === activeIndex ? styles.tabLabelActive : null]}>
              {tab}
            </Text>
          </Pressable>
        ))}
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </View>

      <View style={styles.dotsRow}>{dots}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  tabRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  tabButton: {
    paddingVertical: 10,
  },
  tabLabel: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: 'rgba(0,0,0,0.48)',
  },
  tabLabelActive: {
    color: colors.black,
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    height: 2,
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  dotsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.gold,
  },
});
