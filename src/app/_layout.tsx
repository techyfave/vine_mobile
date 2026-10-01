import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { Body, Screen, Title } from '@/ui/components';

function RootNavigator() {
  const { status, updateRequired } = useAuth();
  if (updateRequired) {
    return (
      <Screen>
        <Title>Update Vine</Title>
        <Body muted>This version is no longer supported. Please update the app from the store to continue.</Body>
      </Screen>
    );
  }
  if (status === 'loading') return null; // splash screen stays up
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="reset-password" options={{ headerShown: true, title: '' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
