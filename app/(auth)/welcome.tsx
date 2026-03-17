import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { AmariEmblem } from '../../components/v2/AmariEmblem';

export default function WelcomeScreen() {
  const router = useRouter();
  const { code, inviter } = useLocalSearchParams<{ code: string; inviter: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.welcomeBox}
        >
          <AmariEmblem variant="onLight" size={72} />

          <Text style={styles.title}>Welcome to AMARI</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            You've been invited to join Australia's premier network for the Black Diaspora.
          </Text>

          {inviter && (
            <Text style={styles.inviterText}>
              Invited by {inviter}
            </Text>
          )}
        </MotiView>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 500 }}
        style={styles.bottom}
      >
        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: '/(auth)/register',
              params: { code },
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Continue to registration"
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  welcomeBox: { alignItems: 'center' },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    fontWeight: '500',
    color: colors.black,
    textAlign: 'center',
    marginTop: spacing.xxl,
    letterSpacing: -0.3,
  },
  divider: {
    width: 32,
    height: 1,
    backgroundColor: colors.sand,
    marginVertical: spacing.lg,
  },
  subtitle: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  inviterText: {
    fontFamily: typography.serif.italic,
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.sand,
    marginTop: spacing.lg,
  },
  bottom: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  continueBtn: {
    backgroundColor: colors.black,
    paddingVertical: spacing.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  continueBtnText: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: 0.3,
  },
});
