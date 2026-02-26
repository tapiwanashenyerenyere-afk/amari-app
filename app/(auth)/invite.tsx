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
import * as Haptics from 'expo-haptics';
import { C, T, S, R } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

export default function InviteScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
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
      const { data, error: dbError } = await supabase
        .from('invitation_codes')
        .select('id, code, tier_grant, expires_at, used_by')
        .eq('code', code.toUpperCase())
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('Invalid or expired invitation code');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setIsValid(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        router.push({
          pathname: '/(auth)/register',
          params: { code: data.code, tier: data.tier_grant },
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back */}
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Text style={{ ...T.nav, color: C.textSecondary }}>← Back</Text>
        </Pressable>

        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Text style={styles.title}>Invitation Code</Text>
            <Text style={styles.subtitle}>
              Enter your code to join the convergence
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
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
              placeholder="AMARI-XXXX-XXX"
              placeholderTextColor={C.textGhost}
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
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [
              styles.validateBtn,
              (isValidating || isValid) && styles.validateBtnDisabled,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleValidate}
            disabled={isValidating || isValid || code.length < 4}
            accessibilityLabel="Validate invitation code"
          >
            {isValidating ? (
              <ActivityIndicator size="small" color={C.lightPrimary} />
            ) : (
              <Text style={styles.validateBtnText}>
                {isValid ? 'Verified ✓' : 'Validate'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  keyboardView: { flex: 1 },
  backBtn: {
    paddingHorizontal: S._20,
    paddingVertical: S._12,
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: S._24,
  },
  title: { ...T.title, color: C.textPrimary, marginBottom: S._8 },
  subtitle: { ...T.body, color: C.textSecondary },
  inputSection: { marginTop: S._32 },
  input: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 4,
    color: C.textPrimary,
    backgroundColor: C.creamSoft,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: S._20,
    textAlign: 'center',
  },
  inputValid: { borderColor: C.olive },
  inputError: { borderColor: C.error },
  errorText: {
    ...T.meta,
    color: C.error,
    marginTop: S._8,
    textAlign: 'center',
  },
  successText: {
    ...T.meta,
    color: C.olive,
    marginTop: S._8,
    textAlign: 'center',
  },
  bottom: {
    paddingHorizontal: S._24,
    paddingBottom: S._32,
  },
  validateBtn: {
    backgroundColor: C.charcoal,
    paddingVertical: S._16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateBtnDisabled: { opacity: 0.6 },
  validateBtnText: { ...T.btn, color: C.lightPrimary },
});
