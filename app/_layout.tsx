import { useEffect, useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { MotiView } from 'moti';
import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_500Medium,
  EBGaramond_600SemiBold,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';
import {
  Syne_400Regular,
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import * as Linking from 'expo-linking';
import { colors } from '../lib/theme';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { QueryProvider } from '../providers/QueryProvider';
import { configureGoogleSignIn } from '../lib/googleAuth';
import { supabase } from '../lib/supabase';
import { Onboarding } from '../components/v2/Onboarding';
import { AmariEmblem } from '../components/v2/AmariEmblem';

SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return <>{children}</>;
}

function AnimatedSplash({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => onComplete(), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View style={splashStyles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.7, translateY: 10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.7, translateY: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        style={{ marginBottom: 24 }}
      >
        <AmariEmblem variant="dark" size={88} />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, translateY: phase >= 2 ? 0 : 10 }}
        transition={{ type: 'timing', duration: 700 }}
      >
        <Text style={splashStyles.wordmark}>AMARI</Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ type: 'timing', duration: 800 }}
        style={splashStyles.divider}
      />

      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: phase >= 3 ? 1 : 0, translateY: phase >= 3 ? 0 : 14 }}
        transition={{ type: 'timing', duration: 900 }}
        style={splashStyles.taglineRow}
      >
        <Text style={splashStyles.taglineFor}>For the </Text>
        <Text style={splashStyles.taglineAlchemists}>Alchemists</Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={splashStyles.bottomLabel}
      >
        <Text style={splashStyles.bottomText}>Australia's Black Diaspora</Text>
      </MotiView>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 8,
    color: colors.black,
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: colors.sand,
    marginTop: 20,
  },
  taglineRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  taglineFor: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 28,
    color: colors.black,
  },
  taglineAlchemists: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 28,
    color: colors.sand,
    fontStyle: 'italic',
  },
  bottomLabel: {
    position: 'absolute',
    bottom: 48,
  },
  bottomText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.gray,
    textTransform: 'uppercase',
  },
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    'EBGaramond-Regular': EBGaramond_400Regular,
    'EBGaramond-Italic': EBGaramond_400Regular_Italic,
    'EBGaramond-Medium': EBGaramond_500Medium,
    'EBGaramond-SemiBold': EBGaramond_600SemiBold,
    'EBGaramond-Bold': EBGaramond_700Bold,
    'Syne-Regular': Syne_400Regular,
    'Syne-Medium': Syne_500Medium,
    'Syne-SemiBold': Syne_600SemiBold,
    'Syne-Bold': Syne_700Bold,
    'Syne-ExtraBold': Syne_800ExtraBold,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-SemiBold': DMSans_600SemiBold,
    'DMSans-Bold': DMSans_700Bold,
    'IBMPlexMono-Regular': IBMPlexMono_400Regular,
    'IBMPlexMono-Medium': IBMPlexMono_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Handle deep link auth callbacks
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (!url.includes('auth-callback')) return;

      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const hash = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } catch (err) {
          console.error('Deep link session error:', err);
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    }).catch((err) => console.error('Initial URL error:', err));

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  if (showSplash) {
    return <AnimatedSplash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <StatusBar style="dark" backgroundColor={colors.bone} />
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bone },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthGuard>
      </AuthProvider>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bone,
  },
});
