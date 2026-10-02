import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { icons } from '@/ui/assets';
import { AppText, ErrorText, SocialButton } from '@/ui/components';
import { space } from '@/ui/theme';

import { useAuth } from './AuthProvider';
import {
  appleAvailable,
  googleConfigured,
  type SocialCredential,
  SocialCancelled,
  signInWithApple,
  useGoogleSignIn,
} from './social';

type Run = (provider: 'apple' | 'google', get: () => Promise<SocialCredential>) => void;

/** "Continue with" + Apple and Google buttons, shared by sign in and sign up. */
export function SocialRow() {
  const { socialSignIn } = useAuth();
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    appleAvailable().then(setApple).catch(() => setApple(false));
  }, []);

  const run: Run = async (provider, get) => {
    setError(undefined);
    setBusy(provider);
    try {
      await socialSignIn(await get());
    } catch (err) {
      if (!(err instanceof SocialCancelled)) setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (!apple && !googleConfigured) return null;
  return (
    <View style={{ gap: space.md }}>
      <AppText variant="label">Continue with</AppText>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        {apple ? (
          <SocialButton
            icon={icons.apple}
            label="Continue with Apple"
            loading={busy === 'apple'}
            onPress={() => run('apple', signInWithApple)}
          />
        ) : null}
        {googleConfigured ? <GoogleButton run={run} busy={busy === 'google'} /> : null}
      </View>
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

/** Separate component so the Google auth hook only mounts when a client ID exists. */
function GoogleButton({ run, busy }: { run: Run; busy: boolean }) {
  const google = useGoogleSignIn();
  return (
    <SocialButton
      icon={icons.google}
      label="Continue with Google"
      loading={busy || google.busy || !google.ready}
      onPress={() => run('google', google.signIn)}
    />
  );
}
