import { useState } from 'react';
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

  const navigateToInvite = () => {
    router.push('/(auth)/invite');
  };

  const handleComplete = () => {
    // Dark-to-light transition: fade out onboarding over 500ms, then navigate
    fadeOut.value = withTiming(0, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(navigateToInvite)();
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
