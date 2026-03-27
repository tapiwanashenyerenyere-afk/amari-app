import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../lib/theme';

export type AlignedView = 'board' | 'map' | 'interests';

interface ViewToggleProps {
  activeView: AlignedView;
  onViewChange: (view: AlignedView) => void;
}

const VIEWS: { key: AlignedView; label: string }[] = [
  { key: 'board', label: 'Board' },
  { key: 'map', label: 'Map' },
  { key: 'interests', label: 'Interests' },
];

export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <View style={styles.container}>
      {VIEWS.map(({ key, label }) => {
        const isActive = activeView === key;

        return (
          <Pressable
            key={key}
            onPress={() => {
              if (key === activeView) {
                return;
              }

              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onViewChange(key);
            }}
            style={[styles.tab, isActive ? styles.tabActive : null]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
          >
            <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(10,10,10,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.05)',
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.black,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  tabText: {
    fontFamily: typography.geo.regular,
    fontSize: 12,
    color: 'rgba(10,10,10,0.52)',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: colors.white,
  },
});
