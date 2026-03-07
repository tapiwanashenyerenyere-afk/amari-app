import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { C, T, S } from '../../lib/constants';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyOtp = async () => {
      const { token_hash, type } = params;

      if (!token_hash || !type) {
        setError('Invalid verification link. Please try signing up again.');
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'email' | 'signup' | 'magiclink',
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      // Auth state change will be picked up by AuthProvider,
      // which will redeem the pending invite code and redirect to (tabs)
    };

    verifyOtp();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verification Failed</Text>
        <Text style={styles.message}>{error}</Text>
        <Text
          style={styles.link}
          onPress={() => router.replace('/(auth)')}
        >
          Back to Sign Up
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={C.charcoal} />
      <Text style={styles.message}>Verifying your account...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: S._24,
  },
  title: {
    ...T.title,
    color: C.textPrimary,
    marginBottom: S._12,
  },
  message: {
    ...T.body,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: S._16,
  },
  link: {
    ...T.btn,
    color: C.burgundy,
    marginTop: S._24,
  },
});
