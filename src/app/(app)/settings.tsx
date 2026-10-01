import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/ui/components';
import { space, useColors } from '@/ui/theme';

export default function Settings() {
  const c = useColors();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();

  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => unwrap(await api.GET('/api/v1/auth/sessions/')),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) =>
      unwrap(await api.DELETE('/api/v1/auth/sessions/{session_id}/', { params: { path: { session_id: id } } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  async function deleteAccount() {
    setError(undefined);
    try {
      unwrap(await api.POST('/api/v1/auth/account/delete/', { body: { password } }));
      await signOut();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function confirmDelete() {
    Alert.alert('Delete account?', 'Your account is deactivated now and permanently deleted after 30 days.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deleteAccount },
    ]);
  }

  return (
    <Screen>
      <Body muted>Signed in as @{user?.username}</Body>

      <Title>Devices</Title>
      {sessions.data?.map((s) => (
        <View key={s.id} style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: space.md, gap: space.xs }}>
          <Text style={{ color: c.text, fontWeight: '600' }}>
            {s.device_name || s.platform} {s.is_current ? '(this device)' : ''}
          </Text>
          <Text style={{ color: c.muted }}>Last active {new Date(s.last_used_at).toLocaleString()}</Text>
          {!s.is_current ? <Button title="Sign out this device" variant="ghost" onPress={() => revoke.mutate(s.id)} /> : null}
        </View>
      ))}

      <Button title="Sign out" variant="ghost" onPress={signOut} />

      <Title>Delete account</Title>
      <Field label="Confirm with your password" value={password} onChangeText={setPassword} secureTextEntry />
      <ErrorText>{error}</ErrorText>
      <Button title="Delete my account" variant="danger" onPress={confirmDelete} disabled={!password} />
    </Screen>
  );
}
