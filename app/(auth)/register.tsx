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
import { C, T, S, R } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const { code, tier } = useLocalSearchParams<{ code: string; tier: string }>();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | 'apple' | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !fullName) {
      Alert.alert('Required', 'Please enter your name and email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: fullName,
            city,
            industry,
            invitation_code: code,
            tier_grant: tier || 'member',
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

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'amari://auth-callback',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleAuth = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'amari://auth-callback',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Apple sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (magicLinkSent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centeredContent}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={[styles.title, { textAlign: 'center' }]}>Check Your Email</Text>
            <Text style={[styles.subtitle, { textAlign: 'center', marginTop: S._8 }]}>
              We sent a magic link to {email}. Tap it to complete your registration.
            </Text>
          </MotiView>
        </View>
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
        >
          {/* Back */}
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Text style={{ ...T.nav, color: C.textSecondary }}>← Back</Text>
          </Pressable>

          <View style={styles.formArea}>
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600 }}
            >
              <Text style={styles.title}>Join the Convergence</Text>
              <Text style={styles.subtitle}>
                Code: {code} · {tier ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier` : 'Member tier'}
              </Text>
            </MotiView>

            {/* Auth method selection */}
            {!authMethod && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 200 }}
                style={styles.methodSection}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.methodBtn,
                    styles.methodBtnDark,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleAppleAuth}
                >
                  <Text style={styles.methodBtnTextLight}>Continue with Apple</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.methodBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleGoogleAuth}
                >
                  <Text style={styles.methodBtnText}>Continue with Google</Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.methodBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => setAuthMethod('email')}
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
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name"
                    placeholderTextColor={C.textGhost}
                    autoCapitalize="words"
                    autoFocus
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={C.textGhost}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Melbourne"
                    placeholderTextColor={C.textGhost}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Industry</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={industry}
                    onChangeText={setIndustry}
                    placeholder="e.g. Technology, Finance"
                    placeholderTextColor={C.textGhost}
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
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={C.lightPrimary} />
                  ) : (
                    <Text style={styles.submitBtnText}>Send Magic Link</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.switchBtn}
                  onPress={() => setAuthMethod(null)}
                >
                  <Text style={{ ...T.nav, color: C.textSecondary }}>
                    ← Other sign-in methods
                  </Text>
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
  container: { flex: 1, backgroundColor: C.cream },
  scrollContent: { flexGrow: 1, paddingBottom: S._40 },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: S._24,
  },
  backBtn: {
    paddingHorizontal: S._20,
    paddingVertical: S._12,
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  formArea: {
    flex: 1,
    paddingHorizontal: S._24,
    paddingTop: S._32,
  },
  title: { ...T.title, color: C.textPrimary, marginBottom: S._8 },
  subtitle: { ...T.body, color: C.textSecondary },
  checkIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: S._16,
    color: C.olive,
  },

  // Method selection
  methodSection: { marginTop: S._32, gap: S._12 },
  methodBtn: {
    backgroundColor: C.creamSoft,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: S._16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBtnDark: {
    backgroundColor: C.charcoal,
    borderColor: C.charcoal,
  },
  methodBtnText: { ...T.btn, color: C.textPrimary },
  methodBtnTextLight: { ...T.btn, color: C.lightPrimary },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S._12,
    marginVertical: S._4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { ...T.meta, color: C.textTertiary },

  // Form
  formSection: { marginTop: S._32, gap: S._20 },
  fieldGroup: { gap: S._6 },
  fieldLabel: { ...T.label, color: C.textTertiary },
  fieldInput: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: C.textPrimary,
    backgroundColor: C.creamSoft,
    borderWidth: 1,
    borderColor: C.border,
    padding: S._16,
  },
  submitBtn: {
    backgroundColor: C.charcoal,
    paddingVertical: S._16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: S._8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { ...T.btn, color: C.lightPrimary },
  switchBtn: {
    paddingVertical: S._12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
});
