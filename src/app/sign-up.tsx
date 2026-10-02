import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { SocialRow } from '@/auth/SocialRow';
import { AuthLayout } from '@/ui/AuthLayout';
import { AppText, Button, Divider, ErrorText, Input, LinkText } from '@/ui/components';
import { colors, space } from '@/ui/theme';

export default function SignUp() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError(undefined);
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signUp({ ...form, email: form.email.trim(), first_name: form.first_name.trim(), last_name: form.last_name.trim() });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const ready = form.first_name.trim() && form.email && form.password.length >= 10 && form.confirm_password;

  return (
    <AuthLayout title="Get Started" background="signup" compactHero>
      <SocialRow />
      <Divider label="OR" />
      <AppText variant="label">Sign Up with Email</AppText>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Input placeholder="First Name" value={form.first_name} onChangeText={set('first_name')} autoComplete="given-name" textContentType="givenName" />
        </View>
        <View style={{ flex: 1 }}>
          <Input placeholder="Last Name" value={form.last_name} onChangeText={set('last_name')} autoComplete="family-name" textContentType="familyName" />
        </View>
      </View>
      <Input placeholder="Email Address" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Input placeholder="Password (10+ characters)" value={form.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <Input placeholder="Confirm Password" value={form.confirm_password} onChangeText={set('confirm_password')} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <ErrorText>{error}</ErrorText>
      <Button title="Sign Up" onPress={submit} loading={loading} disabled={!ready} />
      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Already have an account? <LinkText onPress={() => router.replace('/sign-in')}>Log In</LinkText>
      </AppText>
    </AuthLayout>
  );
}
