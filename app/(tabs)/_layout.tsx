import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { CustomTabBar } from '../../components/v2/CustomTabBar';
import { useMyProfile } from '../../queries/members';
import {
  useAcknowledgeMonthlyInviteAnnouncement,
  useMonthlyInviteStatus,
} from '../../queries/invites';
import { MonthlyInvitePromptModal } from '../../components/invites/MonthlyInvitePromptModal';

export default function TabLayout() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { data: profile } = useMyProfile();
  const { data: inviteStatus } = useMonthlyInviteStatus();
  const acknowledgeInvitePrompt = useAcknowledgeMonthlyInviteAnnouncement();
  const [isInviteModalHidden, setInviteModalHidden] = useState(false);

  useEffect(() => {
    setInviteModalHidden(false);
  }, [inviteStatus?.month_key]);

  const showInviteModal = !!inviteStatus?.eligible
    && !!inviteStatus?.should_show_announcement
    && !isInviteModalHidden;

  const dismissInviteModal = () => {
    setInviteModalHidden(true);
    acknowledgeInvitePrompt.mutate();
  };

  const openInviteCenter = () => {
    setInviteModalHidden(true);
    acknowledgeInvitePrompt.mutate();
    router.push('/member-invites' as any);
  };

  return (
    <>
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

      <MonthlyInvitePromptModal
        visible={showInviteModal}
        fullName={profile?.full_name || 'Member'}
        remaining={inviteStatus?.remaining ?? 0}
        onDismiss={dismissInviteModal}
        onPrimary={openInviteCenter}
      />
    </>
  );
}
