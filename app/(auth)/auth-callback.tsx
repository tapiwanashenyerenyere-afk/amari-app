import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { completeAuthFromUrl } from '../../lib/authCallback';
import { colors, typography, spacing } from '../../lib/theme';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeCallback = async () => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'string') query.set(key, value);
      });

      try {
        const result = await completeAuthFromUrl(`amari://auth-callback?${query.toString()}`);
        if (!result.handled || !result.sessionEstablished) {
          setError('Invalid verification link. Please try signing up again.');
        }
      } catch (err: any) {
        setError(err.message || 'Verification failed. Please try signing up again.');
      }
    };

    completeCallback();
  }, [params]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verification Failed</Text>
        <Text style={styles.message}>{error}</Text>
        <Text
          style={styles.link}
          onPress={() => router.replace('/(auth)')}
          accessibilityRole="link"
        >
          Back to Sign Up
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.black} />
      <Text style={styles.message}>Verifying your account...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 28,
    fontWeight: '500',
    color: colors.black,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  link: {
    fontFamily: typography.body.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.sand,
    marginTop: spacing.xxl,
    letterSpacing: 0.3,
  },
});
