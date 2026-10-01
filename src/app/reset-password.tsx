import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/ui/components';

export default function ResetPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const email = params.email ?? '';

  async function submit() {
    setError(undefined);
    setLoading(true);
    try {
      unwrap(
        await api.POST('/api/v1/auth/password/reset/confirm/', { body: { email, code, new_password: password } }),
      );
      router.replace('/sign-in');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Enter your code</Title>
      <Body muted>If {email} has a Vine account, we sent it a 6-digit code.</Body>
      <Field label="Code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" />
      <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <ErrorText>{error}</ErrorText>
      <Button title="Reset password" onPress={submit} loading={loading} disabled={code.length !== 6 || password.length < 10} />
    </Screen>
  );
}
