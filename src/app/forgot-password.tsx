import { router } from 'expo-router';
import { useState } from 'react';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/ui/components';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(undefined);
    setLoading(true);
    try {
      unwrap(await api.POST('/api/v1/auth/password/reset/request/', { body: { email: email.trim() } }));
      router.push({ pathname: '/reset-password', params: { email: email.trim() } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Reset your password</Title>
      <Body muted>Enter your email and we'll send you a 6-digit code.</Body>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <ErrorText>{error}</ErrorText>
      <Button title="Send code" onPress={submit} loading={loading} disabled={!email} />
    </Screen>
  );
}
