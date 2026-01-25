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
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import { COLORS } from '../../lib/constants';
import { api } from '../../lib/api';

export default function InviteScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    inviterName?: string;
  } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleValidate = async () => {
    if (code.length < 4) {
      setError('Please enter a valid invite code');
      return;
    }

    setError('');
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Call real API
      const result = await api.validateCode(code);
      setValidationResult(result);

      if (result.valid) {
        // Wait a moment to show success, then navigate
        setTimeout(() => {
          router.push({
            pathname: '/(auth)/register',
            params: { code: code.toUpperCase(), inviter: result.inviterName || 'AMARI Team' },
          });
        }, 1000);
      } else {
        setError(result.error || 'This invite code is not valid or has expired.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to validate code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric characters
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setCode(cleaned);
    setError('');
    setValidationResult(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Enter your invite code</Text>
          <Text style={styles.subtitle}>
            Enter the code you received from a current member.
          </Text>

          {/* Code Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={code}
              onChangeText={handleCodeChange}
              placeholder="ENTER CODE"
              placeholderTextColor="rgba(248, 246, 243, 0.3)"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              editable={!isValidating && !validationResult?.valid}
            />

            {/* Status indicator */}
            <View style={styles.statusIcon}>
              {isValidating && (
                <ActivityIndicator size="small" color={COLORS.cream} />
              )}
              {validationResult?.valid && (
                <CheckCircle size={24} color="#10b981" strokeWidth={2} />
              )}
              {validationResult && !validationResult.valid && (
                <XCircle size={24} color="#ef4444" strokeWidth={2} />
              )}
            </View>
          </View>

          {/* Error message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Success message */}
          {validationResult?.valid && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Invited by {validationResult.inviterName}
              </Text>
            </View>
          )}

          {/* Validate button */}
          <Pressable
            style={[
              styles.validateButton,
              (isValidating || validationResult?.valid) && styles.validateButtonDisabled,
            ]}
            onPress={handleValidate}
            disabled={isValidating || validationResult?.valid || code.length < 4}
            accessibilityLabel="Validate invite code"
          >
            <Text style={styles.validateButtonText}>
              {isValidating ? 'VALIDATING...' : validationResult?.valid ? 'VERIFIED' : 'CONTINUE'}
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Membership is by invitation only.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.charcoal,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  title: {
    fontFamily: 'Syne-SemiBold',
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: 'rgba(248, 246, 243, 0.6)',
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 246, 243, 0.2)',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: 20,
    letterSpacing: 4,
    color: COLORS.cream,
    paddingVertical: 16,
  },
  statusIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 16,
  },
  successContainer: {
    marginBottom: 24,
  },
  successText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: '#10b981',
  },
  validateButton: {
    backgroundColor: COLORS.cream,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  validateButtonDisabled: {
    opacity: 0.5,
  },
  validateButtonText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.charcoal,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  footerText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: 'rgba(248, 246, 243, 0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
