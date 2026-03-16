import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '../../lib/theme';
import { PulseIcon, EventsIcon, AlignedIcon, CorridorIcon, ProfileIcon } from './TabIcons';

const TAB_CONFIG = [
  { name: 'index', label: 'Pulse', Icon: PulseIcon },
  { name: 'events', label: 'Events', Icon: EventsIcon },
  { name: 'aligned', label: 'Aligned', Icon: AlignedIcon },
  { name: 'corridor', label: 'Corridor', Icon: CorridorIcon },
  { name: 'profile', label: 'Me', Icon: ProfileIcon },
];

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Filter to only show our 5 main tabs (skip admin, discover, network)
  const visibleRoutes = state.routes.filter((route: any) =>
    TAB_CONFIG.some((tab) => tab.name === route.name)
  );

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]} accessibilityRole="tablist">
      {visibleRoutes.map((route: any) => {
        const tabConfig = TAB_CONFIG.find((tab) => tab.name === route.name);
        if (!tabConfig) return null;

        const { Icon, label } = tabConfig;
        const routeIndex = state.routes.findIndex((r: any) => r.name === route.name);
        const isFocused = state.index === routeIndex;
        const color = isFocused ? colors.black : colors.grayLight;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isFocused }}
            accessibilityHint={`Navigate to ${label} tab`}
          >
            {isFocused && <View style={styles.activeDot} />}
            <Icon color={color} size={18} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
    backgroundColor: colors.bone,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
    gap: 1,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.sand,
  },
  label: {
    fontFamily: typography.geo.medium,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
