import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

// Push registration + tap routing. Registration is quiet and best-effort:
// we ask once, store the Expo push token on the member row (consented via
// notification_preferences), and route briefing notifications to /briefing.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerToken(userId: string) {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'AMARI',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 120],
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status;
    }
    if (status !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (!token) return;

    await supabase.from('members').update({ expo_push_token: token }).eq('id', userId);
  } catch (error) {
    console.warn('[push] registration skipped:', error instanceof Error ? error.message : error);
  }
}

export function usePushSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const registered = useRef(false);

  useEffect(() => {
    if (!user?.id || registered.current) return;
    registered.current = true;
    registerToken(user.id);
  }, [user?.id]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (data?.type === 'briefing') {
        router.push('/briefing');
      }
    });
    return () => sub.remove();
  }, [router]);
}
