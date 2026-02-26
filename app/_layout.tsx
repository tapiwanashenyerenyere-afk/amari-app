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
import { C, T, S, R } from '../lib/constants';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { QueryProvider } from '../providers/QueryProvider';

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
      {/* Logo */}
      <MotiView
        from={{ opacity: 0, scale: 0.7, translateY: 10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.7, translateY: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        style={splashStyles.logoBox}
      >
        <Text style={splashStyles.logoText}>A</Text>
      </MotiView>

      {/* AMARI GROUP */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: phase >= 2 ? 1 : 0, translateY: phase >= 2 ? 0 : 10 }}
        transition={{ type: 'timing', duration: 700 }}
      >
        <Text style={splashStyles.wordmark}>AMARI GROUP</Text>
      </MotiView>

      {/* Divider */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ type: 'timing', duration: 800 }}
        style={splashStyles.divider}
      />

      {/* Tagline */}
      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: phase >= 3 ? 1 : 0, translateY: phase >= 3 ? 0 : 14 }}
        transition={{ type: 'timing', duration: 900 }}
        style={splashStyles.taglineRow}
      >
        <Text style={splashStyles.taglineFor}>For the </Text>
        <Text style={splashStyles.taglineAlchemists}>Alchemists</Text>
      </MotiView>

      {/* Bottom */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={splashStyles.bottomLabel}
      >
        <Text style={{ ...T.label, color: C.textTertiary }}>Australia's Black Diaspora</Text>
      </MotiView>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 88,
    height: 88,
    backgroundColor: C.charcoal,
    borderRadius: R.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S._24,
  },
  logoText: {
    fontFamily: 'Syne-ExtraBold',
    fontSize: 40,
    fontWeight: '800',
    color: C.cream,
  },
  wordmark: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 8,
    color: C.textPrimary,
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: C.burgundy,
    marginTop: S._20,
  },
  taglineRow: {
    flexDirection: 'row',
    marginTop: S._20,
  },
  taglineFor: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 28,
    color: C.textPrimary,
  },
  taglineAlchemists: {
    fontFamily: 'EBGaramond-Regular',
    fontSize: 28,
    color: C.burgundy,
    fontStyle: 'italic',
  },
  bottomLabel: {
    position: 'absolute',
    bottom: S._48,
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
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.charcoal} />
      </View>
    );
  }

  if (showSplash) {
    return <AnimatedSplash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <StatusBar style="dark" backgroundColor={C.cream} />
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.cream },
              animation: 'slide_from_right',
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
    backgroundColor: C.cream,
  },
});
