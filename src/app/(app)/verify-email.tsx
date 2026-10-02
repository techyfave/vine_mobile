import { useState } from 'react';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { AuthLayout } from '@/ui/AuthLayout';
import { AppText, Button, ErrorText, Input, LinkText } from '@/ui/components';
import { colors } from '@/ui/theme';

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
      await reloadUser(); // the verified flag lifts the gate in (app)/_layout
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
    <AuthLayout title="Verify Your Email" compactHero>
      <AppText color={colors.textMuted}>Enter the 6-digit code we sent to {user?.email}.</AppText>
      <Input placeholder="6-digit code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" />
      <ErrorText>{error}</ErrorText>
      {info ? <AppText variant="caption" color={colors.secondary}>{info}</AppText> : null}
      <Button title="Verify" onPress={confirm} loading={loading} disabled={code.length !== 6} />
      <Button title="Send a new code" variant="outline" onPress={resend} />
      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Wrong account? <LinkText onPress={signOut}>Sign out</LinkText>
      </AppText>
    </AuthLayout>
  );
}
