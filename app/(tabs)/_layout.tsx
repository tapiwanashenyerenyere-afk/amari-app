import { Tabs } from 'expo-router';
import { Home, Compass, Calendar, Users, User } from 'lucide-react-native';
import { COLORS } from '../../lib/constants';

const ICON_SIZE = 22;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.charcoal,
        tabBarInactiveTintColor: COLORS.warmGray,
        tabBarStyle: {
          backgroundColor: COLORS.cream,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Home
              size={ICON_SIZE}
              color={focused ? COLORS.charcoal : COLORS.warmGray}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <Compass
              size={ICON_SIZE}
              color={focused ? COLORS.charcoal : COLORS.warmGray}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused }) => (
            <Calendar
              size={ICON_SIZE}
              color={focused ? COLORS.charcoal : COLORS.warmGray}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          tabBarIcon: ({ focused }) => (
            <Users
              size={ICON_SIZE}
              color={focused ? COLORS.charcoal : COLORS.warmGray}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <User
              size={ICON_SIZE}
              color={focused ? COLORS.charcoal : COLORS.warmGray}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
    </Tabs>
  );
}
