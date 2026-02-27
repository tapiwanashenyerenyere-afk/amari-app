import { Stack } from 'expo-router';
import { C } from '../../lib/constants';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.charcoal },
        animation: 'fade',
      }}
    />
  );
}
