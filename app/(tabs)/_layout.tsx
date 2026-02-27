import { Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, T, S, TAB_VISIBILITY, TIER_LEVELS } from '../../lib/constants';
import { useAuth } from '../../providers/AuthProvider';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { tier, isAdmin } = useAuth();
  const tierLevel = TIER_LEVELS[tier] || 1;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.lightPrimary,
        tabBarInactiveTintColor: C.lightTertiary,
        tabBarStyle: {
          backgroundColor: 'rgba(26,26,26,0.92)',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: S._8,
          paddingBottom: Math.max(insets.bottom, S._20),
          height: 84 + Math.max(insets.bottom - 20, 0),
          position: 'absolute',
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans-SemiBold',
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pulse',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>◈</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="aligned"
        options={{
          title: 'Aligned',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>◎</Text>
          ),
          href: tierLevel >= TAB_VISIBILITY.aligned ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="corridor"
        options={{
          title: 'Corridor',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>◇</Text>
          ),
          href: tierLevel >= TAB_VISIBILITY.corridor ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>◆</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>○</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>◉</Text>
          ),
          href: isAdmin ? undefined : null,
        }}
      />
      {/* Hide legacy screens from tab bar */}
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="network" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 16,
    lineHeight: 20,
    color: C.lightFaint,
  },
  iconActive: {
    color: C.lightPrimary,
  },
});
