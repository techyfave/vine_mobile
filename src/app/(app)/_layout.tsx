import { Stack } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { hasSeen, markSeen } from '@/lib/onboarding';
import { registerForPush } from '@/lib/push';
import { duration } from '@/ui/motion';
import { colors, fonts } from '@/ui/theme';

const OnboardingContext = createContext<{ finish: () => void }>({ finish: () => {} });
export const useOnboarding = () => useContext(OnboardingContext);

export default function AppLayout() {
  const { user } = useAuth();
  const verified = user?.email_verified ?? false;
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) hasSeen(user.id, 'onboarding').then(setOnboarded).catch(() => setOnboarded(true));
  }, [user]);

  useEffect(() => {
    registerForPush().catch(() => {
      // Push is optional; never block the app on it.
    });
  }, []);

  const finish = useCallback(() => {
    if (user) markSeen(user.id, 'onboarding').catch(() => {});
    setOnboarded(true);
  }, [user]);

  if (onboarded === null) return null;

  return (
    <OnboardingContext.Provider value={{ finish }}>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontFamily: fonts.brand, color: colors.primary },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
          // One transition style for every pushed screen (same on iOS and Android).
          animation: 'slide_from_right',
          animationDuration: duration.base,
        }}
      >
        <Stack.Protected guard={!verified}>
          <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={verified && !onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
        <Stack.Screen name="create-post" options={{ title: 'Create Post', presentation: 'modal' }} />
        <Stack.Screen name="menu" options={{ title: 'Menu' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings & Privacy' }} />
        <Stack.Screen name="profile/[username]" options={{ title: 'Profile' }} />
        <Stack.Screen name="profile/edit" options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="edit-post/[id]" options={{ title: 'Edit Post', presentation: 'modal' }} />
        <Stack.Screen name="people/[username]" options={{ title: 'People' }} />
        <Stack.Screen name="repost/[id]" options={{ title: 'Repost', presentation: 'modal' }} />
        <Stack.Screen name="lift-update/[id]" options={{ title: 'Lift update', presentation: 'modal' }} />
        <Stack.Screen name="lift-people/[id]" options={{ title: 'Prayer & support' }} />
        <Stack.Screen name="saved" options={{ title: 'Saved' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
      </Stack>
    </OnboardingContext.Provider>
  );
}
