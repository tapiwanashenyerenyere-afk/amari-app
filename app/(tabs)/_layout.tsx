import { Tabs } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { CustomTabBar } from '../../components/v2/CustomTabBar';
import { usePushSetup } from '../../lib/push';

export default function TabLayout() {
  const { isAdmin } = useAuth();
  usePushSetup();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="aligned" />
      <Tabs.Screen name="corridor" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen
        name="admin"
        options={{ href: isAdmin ? undefined : null }}
      />
      {/* Hidden legacy screens */}
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="network" options={{ href: null }} />
    </Tabs>
  );
}
