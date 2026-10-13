import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, onSessionExpired, onUpdateRequired, type Schemas } from '@/api/client';
import { unwrap } from '@/api/errors';
import { clearTokens, loadTokens, saveTokens } from '@/api/tokens';
import { deviceInfo } from '@/lib/device';
import { identify } from '@/lib/sentry';
import { unregisterPushDevice } from '@/lib/push';

import type { SocialCredential } from './social';

type User = Schemas['UserProfileSchema'];
type SignUpInput = { email: string; first_name: string; last_name: string; password: string; confirm_password: string };
type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: Status;
  user: User | null;
  updateRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  socialSignIn: (credential: SocialCredential) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [updateRequired, setUpdateRequired] = useState(false);

  const reset = useCallback(() => {
    setUser(null);
    setStatus('signedOut');
    queryClient.clear(); // never show one account's cached data to the next
  }, [queryClient]);

  const reloadUser = useCallback(async () => {
    const me = unwrap(await api.GET('/api/v1/users/me/'));
    setUser(me);
    return me;
  }, []);

  // Restore the session on launch.
  useEffect(() => {
    (async () => {
      const stored = await loadTokens();
      if (!stored) return reset();
      try {
        await reloadUser();
        setStatus('signedIn');
      } catch {
        reset();
      }
    })();
  }, [reloadUser, reset]);

  useEffect(() => identify(user?.id ?? null), [user]);
  useEffect(() => onSessionExpired(reset), [reset]);
  useEffect(() => onUpdateRequired(() => setUpdateRequired(true)), []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const tokens = unwrap(
        await api.POST('/api/v1/auth/login/', { body: { email, password, device: await deviceInfo() } }),
      );
      await saveTokens(tokens);
      await reloadUser();
      setStatus('signedIn');
    },
    [reloadUser],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const tokens = unwrap(
        await api.POST('/api/v1/auth/register/', { body: { ...input, device: await deviceInfo() } }),
      );
      await saveTokens(tokens);
      await reloadUser();
      setStatus('signedIn');
    },
    [reloadUser],
  );

  const socialSignIn = useCallback(
    async (credential: SocialCredential) => {
      const tokens = unwrap(
        await api.POST('/api/v1/auth/social/', {
          body: {
            ...credential,
            first_name: credential.first_name ?? '',
            last_name: credential.last_name ?? '',
            device: await deviceInfo(),
          },
        }),
      );
      await saveTokens(tokens);
      await reloadUser();
      setStatus('signedIn');
    },
    [reloadUser],
  );

  const signOut = useCallback(async () => {
    try {
      await unregisterPushDevice();
      await api.POST('/api/v1/auth/logout/');
    } catch {
      // Signing out locally must always work, even offline.
    }
    await clearTokens();
    reset();
  }, [reset]);

  const value = useMemo(
    () => ({ status, user, updateRequired, signIn, signUp, socialSignIn, signOut, reloadUser }),
    [status, user, updateRequired, signIn, signUp, socialSignIn, signOut, reloadUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
