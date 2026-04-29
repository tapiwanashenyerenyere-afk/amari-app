import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../providers/AuthProvider';
import { colors, typography, TIER_LEVELS, TAB_VISIBILITY } from '../../lib/theme';
import { PulseIcon, EventsIcon, AlignedIcon, CorridorIcon, ProfileIcon, AdminIcon } from './TabIcons';

const TAB_CONFIG = [
  { name: 'index', label: 'Pulse', Icon: PulseIcon, visibilityKey: 'pulse' },
  { name: 'events', label: 'Events', Icon: EventsIcon, visibilityKey: 'events' },
  { name: 'aligned', label: 'Aligned', Icon: AlignedIcon, visibilityKey: 'aligned' },
  { name: 'corridor', label: 'Corridor', Icon: CorridorIcon, visibilityKey: 'corridor' },
  { name: 'profile', label: 'Me', Icon: ProfileIcon, visibilityKey: 'profile' },
  { name: 'admin', label: 'Admin', Icon: AdminIcon, visibilityKey: 'profile', adminOnly: true },
];

const TIER_NAMES: Record<number, string> = {
  1: 'Member',
  2: 'Silver',
  3: 'Platinum',
  4: 'Laureate',
};

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CustomTabBar({ state, descriptors: _descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { tier, isAdmin } = useAuth();
  const userLevel = TIER_LEVELS[tier as keyof typeof TIER_LEVELS] ?? 1;

  // Keep public navigation simple, but expose the command centre for approved admins.
  const visibleRoutes = state.routes.filter((route: any) =>
    TAB_CONFIG.some((tab) => tab.name === route.name && (!tab.adminOnly || isAdmin))
  );

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]} accessibilityRole="tablist">
      {visibleRoutes.map((route: any) => {
        const tabConfig = TAB_CONFIG.find((tab) => tab.name === route.name);
        if (!tabConfig) return null;

        const { Icon, label, visibilityKey } = tabConfig;
        const routeIndex = state.routes.findIndex((r: any) => r.name === route.name);
        const isFocused = state.index === routeIndex;

        const requiredLevel = TAB_VISIBILITY[visibilityKey] ?? 1;
        const isHidden = requiredLevel >= 99;
        if (isHidden) return null;

        const isLocked = userLevel < requiredLevel;
        const tierName = TIER_NAMES[requiredLevel] || 'Member';

        const baseColor = isFocused ? colors.black : colors.grayLight;
        const tabOpacity = isLocked ? 0.25 : 1;

        const onPress = () => {
          if (isLocked) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
              `${label}`,
              `Available from ${tierName} membership.`
            );
            return;
          }

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
            style={[styles.tab, { opacity: tabOpacity }]}
            accessibilityRole="tab"
            accessibilityLabel={isLocked ? `${label} — requires ${tierName}` : label}
            accessibilityState={{ selected: isFocused }}
            accessibilityHint={isLocked ? `Requires ${tierName} membership` : `Navigate to ${label} tab`}
          >
            {isFocused && !isLocked && <View style={styles.activeDot} />}
            <Icon color={baseColor} size={18} />
            <Text style={[styles.label, { color: baseColor }]}>{label}</Text>
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
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
