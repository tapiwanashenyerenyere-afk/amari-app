import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { C, T, S, R } from '../../lib/constants';

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
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>A</Text>
          </View>

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
          accessibilityLabel="Continue to registration"
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: S._24,
  },
  welcomeBox: { alignItems: 'center' },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: C.charcoal,
    borderRadius: R.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S._24,
  },
  logoText: {
    fontFamily: 'Syne-ExtraBold',
    fontSize: 32,
    fontWeight: '800',
    color: C.cream,
  },
  title: { ...T.title, color: C.textPrimary, textAlign: 'center' },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: C.burgundy,
    marginVertical: S._16,
  },
  subtitle: {
    ...T.body,
    color: C.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  inviterText: {
    ...T.bodyItalic,
    color: C.brass,
    marginTop: S._16,
  },
  bottom: {
    paddingHorizontal: S._24,
    paddingBottom: S._32,
  },
  continueBtn: {
    backgroundColor: C.charcoal,
    paddingVertical: S._16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: { ...T.btn, color: C.lightPrimary },
});
