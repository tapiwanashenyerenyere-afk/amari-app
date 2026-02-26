import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { C, S } from '@/lib/constants';

const TIER_LEVELS = { member: 1, silver: 2, platinum: 3, laureate: 4 };
const TIER_NAMES = { member: 'Member', silver: 'Silver', platinum: 'Platinum', laureate: 'Laureate' };

interface TierGateProps {
  minTier: keyof typeof TIER_LEVELS;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TierGate({ minTier, children, fallback }: TierGateProps) {
  const { tier } = useAuth();
  const router = useRouter();

  if (TIER_LEVELS[tier] >= TIER_LEVELS[minTier]) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <View style={styles.container}>
      <Text style={styles.tierText}>
        {TIER_NAMES[minTier]}+ Feature
      </Text>
      <Pressable
        onPress={() => router.push('/profile' as any)}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.buttonText}>Learn more</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: S._24,
    alignItems: 'center',
    opacity: 0.6,
  },
  tierText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
    color: C.burgundy,
  },
  button: {
    marginTop: S._8,
    paddingHorizontal: S._16,
    paddingVertical: S._8,
  },
  buttonText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: C.textTertiary,
  },
});
