import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { registerForPush } from '@/lib/push';

export default function AppLayout() {
  const { user } = useAuth();
  const verified = user?.email_verified ?? false;

  useEffect(() => {
    registerForPush().catch(() => {
      // Push is optional; never block the app on it.
    });
  }, []);

  return (
    <Stack>
      <Stack.Protected guard={!verified}>
        <Stack.Screen name="verify-email" options={{ title: 'Verify your email', headerBackVisible: false }} />
      </Stack.Protected>
      <Stack.Screen name="index" options={{ title: 'Vine' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
