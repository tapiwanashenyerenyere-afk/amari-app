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
import * as SecureStore from 'expo-secure-store';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { getAuthRedirectUrl } from '../../lib/authRedirect';

export default function InviteScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'invite' | 'member' | 'password'>('invite');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const resetTransientState = () => {
    setError('');
    setOtpError('');
    setIsValid(false);
    setMagicLinkSent(false);
    setOtpCode('');
  };

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
        setError('Invalid, expired, or already used. Existing members can sign in below.');
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
      setError('AMARI could not verify the code. Check your connection and try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleMemberEmailAuth = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Enter the email you used for AMARI.');
      return;
    }

    setError('');
    setOtpError('');
    setIsValidating(true);

    try {
      await SecureStore.deleteItemAsync('pending_invitation_code');
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          shouldCreateUser: false,
        },
      });

      if (signInError) throw signInError;

      setMagicLinkSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Check the email or try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleMemberOtpVerification = async () => {
    const token = otpCode.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (token.length < 6) {
      setOtpError('Enter the 6-digit code from your email.');
      return;
    }

    setOtpError('');
    setIsValidating(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setOtpError(err.message || 'Code verification failed. Try the link or request a new code.');
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
            <Text style={styles.title}>
              {mode === 'invite'
                ? 'Invitation Code'
                : mode === 'member'
                  ? 'Member Sign In'
                  : 'Reviewer Access'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'invite'
                ? 'Enter your code to join the convergence'
                : mode === 'member'
                  ? 'Use the email connected to your AMARI account'
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
          ) : mode === 'member' ? (
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
                  setOtpError('');
                }}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.15)"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!magicLinkSent}
                autoFocus
              />

              {magicLinkSent ? (
                <>
                  <Text style={styles.helperText}>
                    Enter the one-time code from your email, or tap the magic link.
                  </Text>
                  <TextInput
                    style={[styles.input, styles.otpInput, otpError ? styles.inputError : null]}
                    value={otpCode}
                    onChangeText={(value) => {
                      setOtpCode(value.replace(/\D/g, '').slice(0, 6));
                      setOtpError('');
                    }}
                    placeholder="123456"
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    maxLength={6}
                  />
                </>
              ) : null}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
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
            onPress={
              mode === 'invite'
                ? handleValidate
                : mode === 'member'
                  ? magicLinkSent
                    ? handleMemberOtpVerification
                    : handleMemberEmailAuth
                  : handlePasswordSignIn
            }
            disabled={
              isValidating ||
              (mode === 'invite' && (isValid || code.length < 4)) ||
              (mode === 'member' && (!email.trim() || (magicLinkSent && otpCode.trim().length < 6)))
            }
            accessibilityRole="button"
            accessibilityLabel={
              mode === 'invite'
                ? 'Validate invitation code'
                : mode === 'member'
                  ? magicLinkSent
                    ? 'Verify one-time email code'
                    : 'Send member sign-in code'
                  : 'Sign in with review credentials'
            }
          >
            {isValidating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.validateBtnText}>
                {mode === 'invite'
                  ? isValid
                    ? 'Verified'
                    : 'Validate'
                  : mode === 'member'
                    ? magicLinkSent
                      ? 'Verify Code'
                      : 'Send Sign-In Code'
                    : 'Sign In'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.modeSwitchBtn}
            onPress={() => {
              resetTransientState();
              setMode((current) => (current === 'member' ? 'invite' : 'member'));
            }}
            accessibilityRole="button"
            accessibilityLabel={mode === 'member' ? 'Use invitation code' : 'Sign in as an existing member'}
          >
            <Text style={styles.modeSwitchText}>
              {mode === 'member' ? 'Use invitation code instead' : 'Already a member? Sign in with email'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.modeSwitchBtnSecondary}
            onPress={() => {
              resetTransientState();
              setMode((current) => (current === 'password' ? 'invite' : 'password'));
            }}
            accessibilityRole="button"
            accessibilityLabel={mode === 'password' ? 'Use invitation code' : 'Use reviewer password access'}
          >
            <Text style={styles.modeSwitchTextMuted}>
              {mode === 'password' ? 'Use invitation code instead' : 'Reviewer password access'}
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
  otpInput: {
    marginTop: spacing.sm,
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
  },
  inputValid: { borderColor: colors.sand },
  inputError: { borderColor: colors.error },
  helperText: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.42)',
    marginBottom: spacing.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
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
  modeSwitchBtnSecondary: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchText: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  modeSwitchTextMuted: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.26)',
  },
});
