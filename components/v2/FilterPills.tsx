import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, radius } from '../../lib/theme';

interface FilterPillsProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export function FilterPills({ options, selected, onSelect }: FilterPillsProps) {
  return (
    <View style={styles.row}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
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
