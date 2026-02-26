import { Stack } from 'expo-router';
import { C } from '../../lib/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.cream },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="register" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
