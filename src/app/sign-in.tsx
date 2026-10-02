import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { SocialRow } from '@/auth/SocialRow';
import { AuthLayout } from '@/ui/AuthLayout';
import { AppText, Button, Divider, ErrorText, Input, LinkText } from '@/ui/components';
import { colors, space } from '@/ui/theme';

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
    <AuthLayout title="Welcome Back" background="login">
      <SocialRow />
      <Divider label="OR" />
      <AppText variant="label">Log in with Email</AppText>
      <Input placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
      <View style={{ alignItems: 'flex-end' }}>
        <AppText variant="caption" onPress={() => router.push('/forgot-password')}>
          Forgot your password?
        </AppText>
      </View>
      <ErrorText>{error}</ErrorText>
      <Button title="Log In" onPress={submit} loading={loading} disabled={!email || !password} />
      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Don&apos;t have an account? <LinkText onPress={() => router.replace('/sign-up')}>Sign Up</LinkText>
      </AppText>
      <View style={{ height: space.sm }} />
    </AuthLayout>
  );
}
