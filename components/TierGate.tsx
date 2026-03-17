import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/lib/theme';

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
        accessibilityRole="button"
        accessibilityLabel={`Learn more about ${TIER_NAMES[minTier]} features`}
      >
        <Text style={styles.buttonText}>Learn more</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
    opacity: 0.6,
  },
  tierText: {
    fontFamily: typography.geo.bold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.sand,
  },
  button: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    fontFamily: typography.body.medium,
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray,
  },
});
