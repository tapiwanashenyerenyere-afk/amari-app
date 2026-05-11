import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, radius } from '../../lib/theme';

interface FilterPillsProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export function FilterPills({ options, selected, onSelect }: FilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.rowContent}
    >
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option);
            }}
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${option}`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 14,
  },
  rowContent: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center' as const,
    borderRadius: radius.xl,
    backgroundColor: colors.ghost,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  pillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  label: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray,
  },
  labelActive: {
    color: colors.white,
  },
});
