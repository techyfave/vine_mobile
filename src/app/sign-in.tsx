import { router } from 'expo-router';
import { useState } from 'react';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/ui/components';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(undefined);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Welcome to Vine</Title>
      <Body muted>Sign in to keep up with your church and community.</Body>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" />
      <ErrorText>{error}</ErrorText>
      <Button title="Sign in" onPress={submit} loading={loading} disabled={!email || !password} />
      <Button title="Create an account" variant="ghost" onPress={() => router.push('/sign-up')} />
      <Button title="Forgot password?" variant="ghost" onPress={() => router.push('/forgot-password')} />
    </Screen>
  );
}
