import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function PostAuthOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.onboard },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
