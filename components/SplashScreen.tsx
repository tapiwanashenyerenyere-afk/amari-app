import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { COLORS } from '../lib/constants';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0: Initial state
    // Phase 1: Logo appears
    // Phase 2: Loading dots start
    // Phase 3: Complete

    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <View style={styles.container}>
      {/* AMARI Logo Image */}
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: phase >= 1 ? 1 : 0,
          scale: phase >= 1 ? 1 : 0.8,
        }}
        transition={{ type: 'spring', damping: 15, stiffness: 150 }}
        style={styles.logoContainer}
      >
        <Image
          source={require('../assets/images/amari-logo-dark.png')}
          style={styles.logoImage}
          contentFit="contain"
        />
      </MotiView>

      {/* Pulsing Loading Dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.3, scale: 1 }}
            animate={{
              opacity: phase >= 2 ? [0.3, 1, 0.3] : 0.3,
              scale: phase >= 2 ? [1, 1.3, 1] : 1,
            }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              delay: i * 150,
            }}
            style={styles.dot}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 280,
    height: 180,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 48,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.burgundy,
  },
});
