import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from '@expo-google-fonts/nunito';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/ui/components';
import { duration } from '@/ui/motion';
import { colors, space } from '@/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function UpdateRequired() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: space.xxl, gap: space.md }}>
      <AppText variant="title">Update Vine</AppText>
      <AppText color={colors.textMuted}>
        This version is no longer supported. Please update the app from the App Store or Google Play to continue.
      </AppText>
    </View>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status, updateRequired } = useAuth();
  const ready = fontsLoaded && status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null; // native splash stays up
  if (updateRequired) return <UpdateRequired />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        animationDuration: duration.base,
      }}
    >
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
  });
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          {/* If fonts fail to load, carry on with system fonts rather than blocking the app. */}
          <RootNavigator fontsLoaded={fontsLoaded || Boolean(fontError)} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
