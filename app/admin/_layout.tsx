import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { colors, typography, spacing, radius } from '../../lib/theme';

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="small" color={colors.sand} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateTitle}>Admin</Text>
        <Text style={styles.gateMessage}>You do not have admin access.</Text>
        <Pressable style={styles.gateBtn} onPress={() => router.back()}>
          <Text style={styles.gateBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.black },
        animation: 'fade',
      }}
    />
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  gateTitle: {
    fontFamily: typography.serif.medium,
    fontSize: typography.sizes.screenTitle,
    color: colors.black,
    marginBottom: 8,
  },
  gateMessage: {
    fontFamily: typography.body.regular,
    fontSize: typography.sizes.body,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  gateBtn: {
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  gateBtnText: {
    fontFamily: typography.body.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.white,
  },
});
