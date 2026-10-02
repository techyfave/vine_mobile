import { router } from 'expo-router';
import { useState } from 'react';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { AuthLayout } from '@/ui/AuthLayout';
import { AppText, Button, ErrorText, Input, LinkText } from '@/ui/components';
import { colors } from '@/ui/theme';

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
    <AuthLayout title="Reset Password" compactHero>
      <AppText color={colors.textMuted}>Enter your email and we&apos;ll send you a 6-digit code.</AppText>
      <Input placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <ErrorText>{error}</ErrorText>
      <Button title="Send Code" onPress={submit} loading={loading} disabled={!email} />
      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Remembered it? <LinkText onPress={() => router.back()}>Back to Log In</LinkText>
      </AppText>
    </AuthLayout>
  );
}
