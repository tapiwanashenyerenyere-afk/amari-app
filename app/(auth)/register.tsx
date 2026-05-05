import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { colors, typography, spacing, radius } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/googleAuth';
import { signInWithApple } from '../../lib/appleAuth';
import { getAuthRedirectUrl } from '../../lib/authRedirect';

export default function RegisterScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const storePendingCode = async () => {
    await SecureStore.setItemAsync(
      'pending_invitation_code',
      JSON.stringify({ code, fullName, city, industry }),
    );
  };

  const handleEmailAuth = async () => {
    if (!email || !fullName) {
      Alert.alert('Required', 'Please enter your name and email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await storePendingCode();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          shouldCreateUser: true,
          data: {
            full_name: fullName,
            city,
            industry,
            invitation_code: code,
          },
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Auth failed:', err);
      Alert.alert('Error', err.message || 'Something went wrong.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerification = async () => {
    const token = otpCode.trim();

    if (token.length < 6) {
      setOtpError('Enter the 6-digit code from your email.');
      return;
    }

    setOtpError('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'email',
      });

      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setOtpError(err.message || 'Code verification failed. Try the link or request a new code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      await storePendingCode();
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleAuth = async () => {
    setIsSubmitting(true);
    try {
      await storePendingCode();
      await signInWithApple();
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', err.message || 'Apple sign-in failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (magicLinkSent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.centeredContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={[styles.title, { textAlign: 'center' }]}>Check Your Email</Text>
              <Text style={[styles.subtitle, { textAlign: 'center', marginTop: spacing.sm }]}>
                We sent a magic link to {email}. Tap it to complete your registration.
              </Text>
              <Text style={[styles.subtitle, { textAlign: 'center', marginTop: spacing.md }]}>
                If the link opens in a browser instead of AMARI, enter the one-time code from the email below.
              </Text>

              <TextInput
                style={[styles.fieldInput, styles.otpInput]}
                value={otpCode}
                onChangeText={(value) => {
                  setOtpCode(value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                placeholder="123456"
                placeholderTextColor={colors.grayLight}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
                autoFocus
              />

              {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  styles.otpSubmit,
                  isSubmitting && styles.submitBtnDisabled,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
                onPress={handleOtpVerification}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Verify one-time code"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Verify Code</Text>
                )}
              </Pressable>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
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

          <View style={styles.formArea}>
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600 }}
            >
              <Text style={styles.title}>Join the Convergence</Text>
              <Text style={styles.subtitle}>Code: {code}</Text>
            </MotiView>

            {/* Auth method selection */}
            {!authMethod && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 200 }}
                style={styles.methodSection}
              >
                {Platform.OS === 'ios' ? (
                  <Pressable
                    style={({ pressed }) => [styles.methodBtn, styles.appleBtn, pressed && { opacity: 0.85 }]}
                    onPress={handleAppleAuth}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Apple"
                  >
                    <Text style={[styles.methodBtnText, styles.appleBtnText]}>Continue with Apple</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.methodBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleGoogleAuth}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  <Text style={styles.methodBtnText}>Continue with Google</Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.methodBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => setAuthMethod('email')}
                  accessibilityRole="button"
                  accessibilityLabel="Sign up with email"
                >
                  <Text style={styles.methodBtnText}>Sign Up with Email</Text>
                </Pressable>
              </MotiView>
            )}

            {/* Email form */}
            {authMethod === 'email' && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
                style={styles.formSection}
              >
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name"
                    placeholderTextColor={colors.grayLight}
                    autoCapitalize="words"
                    autoFocus
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>EMAIL</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.grayLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CITY</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Melbourne"
                    placeholderTextColor={colors.grayLight}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>INDUSTRY</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={industry}
                    onChangeText={setIndustry}
                    placeholder="e.g. Technology, Finance"
                    placeholderTextColor={colors.grayLight}
                    autoCapitalize="words"
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.submitBtn,
                    isSubmitting && styles.submitBtnDisabled,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={handleEmailAuth}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Send magic link"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.submitBtnText}>Send Magic Link</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.switchBtn}
                  onPress={() => setAuthMethod(null)}
                  accessibilityRole="button"
                >
                  <Text style={styles.backText}>← Other sign-in methods</Text>
                </Pressable>
              </MotiView>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bone },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxxl + 8 },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
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
    color: colors.gray,
  },
  formArea: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    fontWeight: '500',
    color: colors.black,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: colors.gray,
  },
  checkIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.success,
  },
  otpInput: {
    marginTop: spacing.xl,
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
  },
  otpSubmit: {
    marginTop: spacing.md,
  },
  otpError: {
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Method selection
  methodSection: { marginTop: spacing.xxxl, gap: spacing.md },
  methodBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: spacing.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  appleBtn: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  appleBtnText: {
    color: colors.white,
  },
  methodBtnText: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.rule },
  dividerText: {
    fontFamily: typography.mono.regular,
    fontSize: 11,
    color: colors.gray,
    letterSpacing: 1,
  },

  // Form
  formSection: { marginTop: spacing.xxxl, gap: spacing.xl },
  fieldGroup: { gap: spacing.xs + 2 },
  fieldLabel: {
    fontFamily: typography.geo.medium,
    fontSize: 9,
    fontWeight: '500',
    color: colors.sand,
    letterSpacing: 1.5,
  },
  fieldInput: {
    fontFamily: typography.body.regular,
    fontSize: 15,
    color: colors.black,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  submitBtn: {
    backgroundColor: colors.black,
    paddingVertical: spacing.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    letterSpacing: 0.3,
  },
  switchBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
});
