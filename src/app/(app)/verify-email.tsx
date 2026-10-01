import { router } from 'expo-router';
import { useState } from 'react';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { Body, Button, ErrorText, Field, Screen } from '@/ui/components';

export default function VerifyEmail() {
  const { user, reloadUser, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setError(undefined);
    setLoading(true);
    try {
      unwrap(await api.POST('/api/v1/auth/email/verify/confirm/', { body: { code } }));
      await reloadUser();
      router.replace('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(undefined);
    try {
      unwrap(await api.POST('/api/v1/auth/email/verify/request/'));
      setInfo('A new code is on its way.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Screen>
      <Body>Enter the 6-digit code we sent to {user?.email}.</Body>
      <Field label="Code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" />
      <ErrorText>{error}</ErrorText>
      {info ? <Body muted>{info}</Body> : null}
      <Button title="Verify" onPress={confirm} loading={loading} disabled={code.length !== 6} />
      <Button title="Send a new code" variant="ghost" onPress={resend} />
      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
