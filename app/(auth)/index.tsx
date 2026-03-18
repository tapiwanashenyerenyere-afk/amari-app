import { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Onboarding } from '../../components/v2/Onboarding';
import { colors } from '../../lib/theme';

export default function AuthLandingScreen() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const fadeOut = useSharedValue(1);
  const validatedCodeRef = useRef('');

  const navigateAfterOnboarding = () => {
    if (validatedCodeRef.current) {
      // Code was validated inline — go straight to register
      router.push({
        pathname: '/(auth)/register',
        params: { code: validatedCodeRef.current },
      });
    } else {
      // "Already a member?" sign-in flow — go to invite as fallback
      router.push('/(auth)/invite');
    }
  };

  const handleComplete = (validatedCode: string) => {
    validatedCodeRef.current = validatedCode;
    // Dark-to-light transition: fade out onboarding over 500ms, then navigate
    fadeOut.value = withTiming(0, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(navigateAfterOnboarding)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Onboarding onComplete={handleComplete} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
});
