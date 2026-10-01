import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, onSessionExpired, onUpdateRequired, type Schemas } from '@/api/client';
import { unwrap } from '@/api/errors';
import { clearTokens, loadTokens, saveTokens } from '@/api/tokens';
import { deviceInfo } from '@/lib/device';
import { unregisterPushDevice } from '@/lib/push';

type User = Schemas['UserProfileSchema'];
type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: Status;
  user: User | null;
  updateRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; username: string; password: string }) => Promise<void>;
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
    async (input: { email: string; username: string; password: string }) => {
      const tokens = unwrap(
        await api.POST('/api/v1/auth/register/', {
          body: { ...input, confirm_password: input.password, device: await deviceInfo() },
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
    () => ({ status, user, updateRequired, signIn, signUp, signOut, reloadUser }),
    [status, user, updateRequired, signIn, signUp, signOut, reloadUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
