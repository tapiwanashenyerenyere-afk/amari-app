import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/lib/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>AMARI</Text>
      <Text style={styles.title}>This page does not exist.</Text>
      <Text style={styles.copy}>
        The link may be out of date or the route may have moved.
      </Text>
      <Pressable style={styles.button} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.buttonText}>Return Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  eyebrow: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: typography.serif.medium,
    fontSize: 30,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  copy: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.white,
  },
});
