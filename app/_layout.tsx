import { useEffect, useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
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
import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_300Light_Italic,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_500Medium_Italic,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_300Light,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import * as Linking from 'expo-linking';
import { colors, typography } from '../lib/theme';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { QueryProvider } from '../providers/QueryProvider';
import { configureGoogleSignIn } from '../lib/googleAuth';
import { initMapbox } from '../lib/mapbox';
import { completeAuthFromUrl } from '../lib/authCallback';
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
  }, [session, isLoading, segments, router]);

  return <>{children}</>;
}

function AnimatedSplash({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const particleLines = [
    { left: '15%', height: 120, duration: 8000, delay: 0 },
    { left: '35%', height: 80, duration: 10000, delay: 2000 },
    { left: '55%', height: 100, duration: 7000, delay: 1000 },
    { left: '75%', height: 90, duration: 9000, delay: 3000 },
    { left: '90%', height: 70, duration: 11000, delay: 4000 },
  ] as const;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => onComplete(), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <View style={splashStyles.container}>
      <StatusBar style="light" backgroundColor={colors.void} />
      <View style={splashStyles.ambientMesh}>
        <MotiView
          from={{ translateX: 0, translateY: 0, scale: 1, rotate: '0deg' }}
          animate={{ translateX: 16, translateY: 10, scale: 1.05, rotate: '2deg' }}
          transition={{ type: 'timing', duration: 12000, loop: true, repeatReverse: true }}
          style={[splashStyles.meshOrb, splashStyles.meshGold]}
        />
        <MotiView
          from={{ translateX: 0, translateY: 0, scale: 1, rotate: '0deg' }}
          animate={{ translateX: -14, translateY: -18, scale: 1.04, rotate: '-1deg' }}
          transition={{ type: 'timing', duration: 13000, loop: true, repeatReverse: true }}
          style={[splashStyles.meshOrb, splashStyles.meshBurgundy]}
        />
        <MotiView
          from={{ translateX: 0, translateY: 0, scale: 1 }}
          animate={{ translateX: 8, translateY: -14, scale: 1.03 }}
          transition={{ type: 'timing', duration: 11000, loop: true, repeatReverse: true }}
          style={[splashStyles.meshOrb, splashStyles.meshTeal]}
        />
      </View>

      <MotiView
        from={{ opacity: 0.7, scale: 1 }}
        animate={{ opacity: 1, scale: 1.15 }}
        transition={{ type: 'timing', duration: 4000, loop: true, repeatReverse: true }}
        style={[splashStyles.orb, splashStyles.goldOrbLarge]}
      />
      <MotiView
        from={{ opacity: 0.55, scale: 1 }}
        animate={{ opacity: 0.92, scale: 1.14 }}
        transition={{ type: 'timing', duration: 5000, delay: 1000, loop: true, repeatReverse: true }}
        style={[splashStyles.orb, splashStyles.burgundyOrb]}
      />
      <MotiView
        from={{ opacity: 0.4, scale: 1 }}
        animate={{ opacity: 0.78, scale: 1.12 }}
        transition={{ type: 'timing', duration: 6000, delay: 2000, loop: true, repeatReverse: true }}
        style={[splashStyles.orb, splashStyles.tealOrb]}
      />
      <MotiView
        from={{ opacity: 0.45, scale: 1 }}
        animate={{ opacity: 0.85, scale: 1.13 }}
        transition={{ type: 'timing', duration: 7000, delay: 500, loop: true, repeatReverse: true }}
        style={[splashStyles.orb, splashStyles.goldOrbSmall]}
      />

      <View style={splashStyles.particleLayer} pointerEvents="none">
        {particleLines.map((line) => (
          <MotiView
            key={`${line.left}-${line.height}`}
            from={{ translateY: 420, opacity: 0 }}
            animate={{ translateY: -420, opacity: 1 }}
            transition={{ type: 'timing', duration: line.duration, delay: line.delay, loop: true }}
            style={[splashStyles.particleLine, { left: line.left, height: line.height }]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(201,169,98,0.16)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </MotiView>
        ))}
      </View>

      <View style={splashStyles.grain} pointerEvents="none" />

      <MotiView
        from={{ opacity: 0, scale: 0.7, translateY: 10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.7, translateY: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        style={splashStyles.emblemWrap}
      >
        <AmariEmblem variant="dark" size={90} borderRadius={20} />
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
      >
        <LinearGradient
          colors={['transparent', colors.gold, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </MotiView>

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
        style={splashStyles.watermarkWrap}
      >
        <AmariEmblem variant="dark" size={32} borderRadius={8} />
      </MotiView>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  meshOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  meshGold: {
    width: 320,
    height: 260,
    left: -20,
    top: 140,
    backgroundColor: 'rgba(201,169,98,0.08)',
  },
  meshBurgundy: {
    width: 260,
    height: 320,
    right: -40,
    bottom: 150,
    backgroundColor: 'rgba(114,47,55,0.08)',
  },
  meshTeal: {
    width: 300,
    height: 200,
    left: 40,
    bottom: -20,
    backgroundColor: 'rgba(80,160,140,0.05)',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  goldOrbLarge: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(201,169,98,0.07)',
  },
  burgundyOrb: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(114,47,55,0.05)',
  },
  tealOrb: {
    width: 200,
    height: 200,
    left: 40,
    bottom: 180,
    backgroundColor: 'rgba(80,160,140,0.05)',
  },
  goldOrbSmall: {
    width: 150,
    height: 150,
    right: 50,
    top: 160,
    backgroundColor: 'rgba(201,169,98,0.06)',
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  particleLine: {
    position: 'absolute',
    top: 0,
    width: 1,
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  emblemWrap: {
    marginBottom: 24,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  wordmark: {
    fontFamily: typography.body.semiBold,
    fontSize: 18,
    letterSpacing: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 40,
    marginTop: 20,
    overflow: 'hidden',
  },
  taglineRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  taglineFor: {
    fontFamily: typography.body.light,
    fontSize: 16,
    color: 'rgba(255,255,255,0.35)',
  },
  taglineAlchemists: {
    fontFamily: typography.body.lightItalic,
    fontSize: 16,
    color: colors.gold,
  },
  watermarkWrap: {
    marginTop: 32,
    opacity: 0.12,
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
    PlusJakartaSans_300Light,
    PlusJakartaSans_300Light_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_400Regular_Italic,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_500Medium_Italic,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    JetBrainsMono_300Light,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
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
    initMapbox();
  }, []);

  // Handle deep link auth callbacks
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      try {
        await completeAuthFromUrl(event.url);
      } catch (err) {
        console.error('Deep link auth callback error:', err);
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
