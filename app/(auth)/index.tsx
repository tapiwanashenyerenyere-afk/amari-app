import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { C, T, S, R } from '../../lib/constants';

export default function AuthLandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Logo */}
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.logoBox}
        >
          <Text style={styles.logoText}>A</Text>
        </MotiView>

        {/* Title */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 300 }}
        >
          <Text style={styles.wordmark}>AMARI GROUP</Text>
        </MotiView>

        {/* Divider */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 800, delay: 600 }}
          style={styles.divider}
        />

        {/* Tagline */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 900, delay: 800 }}
          style={styles.taglineRow}
        >
          <Text style={styles.taglineFor}>For the </Text>
          <Text style={styles.taglineAlchemists}>Alchemists</Text>
        </MotiView>
      </View>

      {/* Bottom actions */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 800, delay: 1200 }}
        style={styles.bottom}
      >
        <Pressable
          style={({ pressed }) => [
            styles.enterBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(auth)/invite');
          }}
          accessibilityLabel="Enter with invitation code"
        >
          <Text style={styles.enterBtnText}>Enter</Text>
        </Pressable>

        <Text style={styles.bottomLabel}>Australia's Black Diaspora</Text>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
  },
  content: {
    flex: 1,
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
  bottom: {
    alignItems: 'center',
    paddingBottom: S._48,
    paddingHorizontal: S._20,
  },
  enterBtn: {
    paddingVertical: S._16,
    paddingHorizontal: S._56,
    minHeight: 48,
    borderRadius: R.pill,
    backgroundColor: 'rgba(201,169,98,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,98,0.35)',
    marginBottom: S._20,
  },
  enterBtnText: {
    ...T.btn,
    fontSize: 14,
    color: C.textPrimary,
  },
  bottomLabel: {
    ...T.label,
    color: C.textTertiary,
  },
});
