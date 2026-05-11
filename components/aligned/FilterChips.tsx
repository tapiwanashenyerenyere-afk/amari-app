import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../lib/theme';
import { CATEGORY_COLORS } from '../../lib/mapbox';
import type { ProjectCategory } from '../../types/database';

interface FilterChipsProps {
  activeFilter: ProjectCategory | null;
  onFilterChange: (filter: ProjectCategory | null) => void;
}

const FILTERS: { key: ProjectCategory | null; label: string }[] = [
  { key: null, label: 'All' },
  { key: 'venture', label: 'Venture' },
  { key: 'advisory', label: 'Advisory' },
  { key: 'creative', label: 'Creative' },
  { key: 'impact', label: 'Impact' },
  { key: 'culture', label: 'Culture' },
  { key: 'health', label: 'Health' },
  { key: 'tech', label: 'Tech' },
];

export function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map(({ key, label }) => {
        const isActive = activeFilter === key;
        const accent = key ? CATEGORY_COLORS[key]?.accent ?? colors.gold : colors.gold;

        return (
          <Pressable
            key={key ?? 'all'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFilterChange(key);
            }}
            style={[
              styles.chip,
              isActive ? styles.chipActive : null,
              isActive ? { borderColor: accent } : null,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Filter by ${label}`}
          >
            <View style={[styles.dot, { backgroundColor: accent, opacity: isActive ? 1 : 0.45 }]} />
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.08)',
    backgroundColor: colors.cream,
  },
  chipActive: {
    backgroundColor: colors.black,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    color: colors.gray,
  },
  labelActive: {
    color: colors.white,
  },
});
