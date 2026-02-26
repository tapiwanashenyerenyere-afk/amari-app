import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { MotiView, AnimatePresence } from 'moti';
import { COLORS } from '../lib/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface IntroVideoProps {
  onComplete: () => void;
}

export default function IntroVideo({ onComplete }: IntroVideoProps) {
  const videoRef = useRef<Video>(null);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  // Show skip button after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      setIsVideoFinished(true);
      // Auto-continue after video finishes
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const handleSkip = () => {
    videoRef.current?.stopAsync();
    onComplete();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Full-screen video */}
      <Video
        ref={videoRef}
        source={require('../assets/videos/welcome-mobile.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        isMuted={false}
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* AMARI logo image */}
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 300, type: 'spring', damping: 15 }}
        style={styles.logoContainer}
      >
        <Image
          source={require('../assets/images/amari-logo-dark.png')}
          style={styles.logoImage}
          contentFit="contain"
        />
      </MotiView>

      {/* Skip button */}
      <AnimatePresence>
        {showSkip && !isVideoFinished && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.skipContainer}
          >
            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
              accessibilityLabel="Skip intro"
            >
              <Text style={styles.skipText}>SKIP</Text>
            </Pressable>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Tagline at bottom */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 1000, type: 'timing', duration: 600 }}
        style={styles.taglineContainer}
      >
        <Text style={styles.tagline}>BLACK & GIFTED</Text>
        <Text style={styles.subTagline}>Australia's Black Diaspora Community</Text>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.charcoal,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 120,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
  },
  skipText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.cream,
  },
  taglineContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tagline: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    letterSpacing: 4,
    color: COLORS.cream,
    marginBottom: 8,
  },
  subTagline: {
    fontFamily: 'EBGaramond-Italic',
    fontSize: 16,
    color: 'rgba(248, 246, 243, 0.7)',
  },
});
