import { useState } from 'react';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/ui/components';

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(undefined);
    setLoading(true);
    try {
      await signUp({ email: email.trim(), username: username.trim(), password });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Create your account</Title>
      <Body muted>We'll email you a 6-digit code to confirm your address.</Body>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
      <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username-new" />
      <Field label="Password (10+ characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <ErrorText>{error}</ErrorText>
      <Button title="Create account" onPress={submit} loading={loading} disabled={!email || !username || password.length < 10} />
    </Screen>
  );
}
