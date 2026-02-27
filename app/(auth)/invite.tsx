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
import { GrainOverlay } from '../../components/ui/GrainOverlay';

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Aurora background blobs */}
      <View style={styles.auroraContainer}>
        <View
          style={[
            styles.auroraBlob,
            {
              backgroundColor: 'rgba(201,169,98,0.12)',
              top: '15%',
              left: -60,
              width: 280,
              height: 280,
              borderRadius: 140,
            },
          ]}
        />
        <View
          style={[
            styles.auroraBlob,
            {
              backgroundColor: 'rgba(114,47,55,0.08)',
              bottom: '20%',
              right: -40,
              width: 260,
              height: 260,
              borderRadius: 130,
            },
          ]}
        />
      </View>

      {/* Grain texture */}
      <GrainOverlay opacity={0.03} />

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
          <Text style={{ ...T.nav, color: C.lightTertiary }}>← Back</Text>
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
              placeholder="AMARI-XXXX-XXX"
              placeholderTextColor={C.lightFaint}
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
            onPress={handleValidate}
            disabled={isValidating || isValid || code.length < 4}
            accessibilityLabel="Validate invitation code"
          >
            {isValidating ? (
              <ActivityIndicator size="small" color={C.lightPrimary} />
            ) : (
              <Text style={styles.validateBtnText}>
                {isValid ? 'Verified' : 'Validate'}
              </Text>
            )}
          </Pressable>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  keyboardView: { flex: 1 },

  // Aurora
  auroraContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  auroraBlob: { position: 'absolute', opacity: 1 },

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
  title: { ...T.title, color: C.lightPrimary, marginBottom: S._8 },
  subtitle: { ...T.body, color: C.lightSecondary },
  inputSection: { marginTop: S._32 },
  input: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 4,
    color: C.lightPrimary,
    backgroundColor: 'rgba(248,246,243,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(248,246,243,0.12)',
    borderRadius: 14,
    padding: S._20,
    textAlign: 'center',
  },
  inputValid: { borderColor: C.oliveOnDark },
  inputError: { borderColor: C.error },
  errorText: {
    ...T.meta,
    color: C.error,
    marginTop: S._8,
    textAlign: 'center',
  },
  successText: {
    ...T.meta,
    color: C.oliveOnDark,
    marginTop: S._8,
    textAlign: 'center',
  },
  bottom: {
    paddingHorizontal: S._24,
    paddingBottom: S._32,
  },
  validateBtn: {
    backgroundColor: 'rgba(114,47,55,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(196,112,122,0.2)',
    borderRadius: 14,
    paddingVertical: S._16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateBtnDisabled: { opacity: 0.6 },
  validateBtnText: { ...T.btn, color: C.lightPrimary },
});
