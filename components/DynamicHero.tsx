import { useEffect, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { COLORS } from '../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium event imagery
const heroImages = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80', // Gala event
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80', // Elegant gathering
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&q=80', // Celebration
  'https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?w=1200&q=80', // Community
];

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface DynamicHeroProps {
  title?: string;
  subtitle?: string;
  height?: number;
  children?: ReactNode;
}

export default function DynamicHero({
  title,
  subtitle,
  height = 420,
  children,
}: DynamicHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const transition = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      // Prepare next image
      setNextIndex((currentIndex + 1) % heroImages.length);

      // Start transition
      transition.value = 0;
      transition.value = withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });

      // Update current index after transition starts
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroImages.length);
      }, 1200);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, transition]);

  const currentImageStyle = useAnimatedStyle(() => ({
    opacity: transition.value,
    transform: [
      {
        scale: interpolate(transition.value, [0, 1], [1.08, 1.02]),
      },
    ],
  }));

  const nextImageStyle = useAnimatedStyle(() => ({
    opacity: 1 - transition.value,
    transform: [
      {
        scale: interpolate(transition.value, [0, 1], [1.02, 1.08]),
      },
    ],
  }));

  return (
    <View style={[styles.container, { height }]}>
      {/* Next image (underneath) */}
      <AnimatedImage
        source={{ uri: heroImages[nextIndex] }}
        style={[styles.backgroundImage, nextImageStyle]}
        contentFit="cover"
        transition={0}
      />

      {/* Current image (on top) */}
      <AnimatedImage
        source={{ uri: heroImages[currentIndex] }}
        style={[styles.backgroundImage, currentImageStyle]}
        contentFit="cover"
        transition={0}
      />

      {/* Gradient overlay - burgundy tint to charcoal */}
      <LinearGradient
        colors={[
          'rgba(114, 47, 55, 0.25)',
          'rgba(26, 26, 26, 0.55)',
          'rgba(26, 26, 26, 0.9)',
          COLORS.charcoal,
        ]}
        locations={[0, 0.45, 0.8, 1]}
        style={styles.gradient}
      />

      {/* Content area */}
      <View style={styles.content}>
        {title && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
          >
            <Text style={styles.title}>{title}</Text>
          </MotiView>
        )}

        {subtitle && (
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 350 }}
          >
            <Text style={styles.subtitle}>{subtitle}</Text>
          </MotiView>
        )}

        {children && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 500 }}
            style={styles.childrenContainer}
          >
            {children}
          </MotiView>
        )}
      </View>

      {/* Image indicators */}
      <View style={styles.indicators}>
        {heroImages.map((_, idx) => (
          <MotiView
            key={idx}
            animate={{
              width: idx === currentIndex ? 24 : 6,
              opacity: idx === currentIndex ? 1 : 0.4,
            }}
            transition={{ type: 'timing', duration: 300 }}
            style={[
              styles.indicator,
              idx === currentIndex && styles.indicatorActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.charcoal,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Syne-Bold',
    fontSize: 32,
    color: COLORS.cream,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: 'rgba(248, 246, 243, 0.75)',
    lineHeight: 22,
    maxWidth: '85%',
  },
  childrenContainer: {
    marginTop: 20,
  },
  indicators: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  indicator: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cream,
  },
  indicatorActive: {
    backgroundColor: COLORS.gold,
  },
});
