import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';
import { colors } from '../../../lib/theme';

export default function AlignedLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="small" color={colors.sand} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
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
  },
});
