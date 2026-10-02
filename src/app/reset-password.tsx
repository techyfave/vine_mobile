import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { AuthLayout } from '@/ui/AuthLayout';
import { AppText, Button, ErrorText, Input } from '@/ui/components';
import { colors } from '@/ui/theme';

export default function ResetPassword() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(undefined);
    setLoading(true);
    try {
      unwrap(await api.POST('/api/v1/auth/password/reset/confirm/', { body: { email, code, new_password: password } }));
      router.dismissTo('/sign-in');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Enter Your Code" compactHero>
      <AppText color={colors.textMuted}>If {email} has a Vine account, we sent it a 6-digit code.</AppText>
      <Input placeholder="6-digit code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" />
      <Input placeholder="New Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <ErrorText>{error}</ErrorText>
      <Button title="Reset Password" onPress={submit} loading={loading} disabled={code.length !== 6 || password.length < 10} />
    </AuthLayout>
  );
}
