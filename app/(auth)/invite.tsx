import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

export default function InviteScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'invite' | 'password'>('invite');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleValidate = async () => {
    if (code.length < 4) {
      setError('Please enter a valid invite code');
      return;
    }

    setError('');
    setIsValidating(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('validate_invitation_code', {
        p_code: code.toUpperCase(),
      });

      if (rpcError) throw rpcError;

      if (data?.error === 'rate_limited') {
        setError('Too many attempts. Please wait an hour.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (!data?.valid) {
        setError('Invalid or expired invitation code');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setIsValid(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        router.push({
          pathname: '/(auth)/register',
          params: { code: code.toUpperCase() },
        });
      }, 800);
    } catch (err) {
      console.error('Validation failed:', err);
      setError('Something went wrong. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Enter the review account email and password');
      return;
    }

    setError('');
    setIsValidating(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Check the review account credentials.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Ambient gradient */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(160,133,107,0.07)', 'transparent']}
          start={{ x: 0.3, y: 0.15 }}
          end={{ x: 0.7, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back */}
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Text style={styles.title}>{mode === 'invite' ? 'Invitation Code' : 'Reviewer Access'}</Text>
            <Text style={styles.subtitle}>
              {mode === 'invite'
                ? 'Enter your code to join the convergence'
                : 'Use the demo credentials supplied in App Store Connect'}
            </Text>
          </MotiView>

          {mode === 'invite' ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 250 }}
              style={styles.inputSection}
            >
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  isValid && styles.inputValid,
                  error ? styles.inputError : null,
                ]}
                value={code}
                onChangeText={(text) => {
                  setCode(text.toUpperCase());
                  setError('');
                  setIsValid(false);
                }}
                placeholder="AMARI-PLAT-XXXXXXXX"
                placeholderTextColor="rgba(255,255,255,0.15)"
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
              />

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : isValid ? (
                <Text style={styles.successText}>Code verified</Text>
              ) : null}
            </MotiView>
          ) : (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 250 }}
              style={styles.inputSection}
            >
              <TextInput
                style={[styles.input, styles.passwordInput, error ? styles.inputError : null]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                placeholder="reviewer@example.com"
                placeholderTextColor="rgba(255,255,255,0.15)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              <TextInput
                style={[styles.input, styles.passwordInput, error ? styles.inputError : null]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.15)"
                secureTextEntry
                autoCapitalize="none"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </MotiView>
          )}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={styles.bottom}
        >
          <Pressable
            style={({ pressed }) => [
              styles.validateBtn,
              (isValidating || isValid) && styles.validateBtnDisabled,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={mode === 'invite' ? handleValidate : handlePasswordSignIn}
            disabled={isValidating || (mode === 'invite' && (isValid || code.length < 4))}
            accessibilityRole="button"
            accessibilityLabel={mode === 'invite' ? 'Validate invitation code' : 'Sign in with review credentials'}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.validateBtnText}>
                {mode === 'invite' ? (isValid ? 'Verified' : 'Validate') : 'Sign In'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.modeSwitchBtn}
            onPress={() => {
              setError('');
              setIsValid(false);
              setMode((current) => (current === 'invite' ? 'password' : 'invite'));
            }}
            accessibilityRole="button"
            accessibilityLabel={mode === 'invite' ? 'Use review credentials' : 'Use invitation code'}
          >
            <Text style={styles.modeSwitchText}>
              {mode === 'invite' ? 'Reviewer or existing member sign in' : 'Use invitation code instead'}
            </Text>
          </Pressable>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.onboard },
  keyboardView: { flex: 1 },
  backBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  backText: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },
  inputSection: { marginTop: spacing.xxxl },
  input: {
    fontFamily: typography.body.medium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 4,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: spacing.xl,
    textAlign: 'center',
  },
  passwordInput: {
    marginBottom: spacing.md,
    textAlign: 'left',
    letterSpacing: 0,
    fontSize: 15,
  },
  inputValid: { borderColor: colors.sand },
  inputError: { borderColor: colors.error },
  errorText: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  successText: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.success,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  bottom: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  validateBtn: {
    backgroundColor: colors.sand,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateBtnDisabled: { opacity: 0.6 },
  validateBtnText: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: 0.3,
  },
  modeSwitchBtn: {
    marginTop: spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchText: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
});
