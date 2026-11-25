import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { Sentry } from '@/lib/sentry';
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

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
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

// Sentry.wrap reports render crashes; it does nothing when Sentry is off.
export default Sentry.wrap(RootLayout);
