import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { timeAgo } from '@/lib/time';
import { AppText, Button, Card, ErrorText, Input } from '@/ui/components';
import { colors, space } from '@/ui/theme';

export default function Settings() {
  const { signOut } = useAuth();
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();

  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => unwrap(await api.GET('/api/v1/auth/sessions/')),
  });
  const revoke = useMutation({
    mutationFn: async (id: string) =>
      unwrap(await api.DELETE('/api/v1/auth/sessions/{session_id}/', { params: { path: { session_id: id } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  async function deleteAccount() {
    setError(undefined);
    try {
      unwrap(await api.POST('/api/v1/auth/account/delete/', { body: { password, confirm } }));
      await signOut();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <Card style={{ gap: space.md }}>
        <AppText variant="heading">Where you&apos;re signed in</AppText>
        {sessions.data?.map((s) => (
          <View key={s.id} style={styles.session}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">
                {s.device_name || s.platform}
                {s.is_current ? ' · this device' : ''}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Active {timeAgo(s.last_used_at)}
              </AppText>
            </View>
            {!s.is_current ? <Button title="Sign out" size="sm" variant="outline" onPress={() => revoke.mutate(s.id)} /> : null}
          </View>
        ))}
      </Card>

      <Card style={{ gap: space.md }}>
        <AppText variant="heading">Delete account</AppText>
        <AppText color={colors.textMuted}>
          Your account is deactivated straight away and permanently deleted after 30 days.
        </AppText>
        <Input placeholder="Your password" value={password} onChangeText={setPassword} secureTextEntry />
        <AppText variant="caption" color={colors.textMuted}>
          Signed up with Apple or Google? Leave the password empty and type DELETE below.
        </AppText>
        <Input placeholder="Type DELETE" value={confirm} onChangeText={setConfirm} autoCapitalize="characters" />
        <ErrorText>{error}</ErrorText>
        <Button
          title="Delete my account"
          variant="danger"
          disabled={!password && confirm !== 'DELETE'}
          onPress={() =>
            Alert.alert('Delete account?', 'This cannot be undone after 30 days.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: deleteAccount },
            ])
          }
        />
      </Card>
      <AboutApp />
    </ScrollView>
  );
}

/** Which build and update this phone is running, plus a manual "check for updates". */
function AboutApp() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const updateId = Updates.updateId ? Updates.updateId.slice(0, 8) : 'built-in';
  const published = Updates.createdAt ? Updates.createdAt.toLocaleString() : null;

  async function check() {
    if (!Updates.isEnabled) {
      setStatus('Updates are off in development builds. Metro serves the latest code.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const found = await Updates.checkForUpdateAsync();
      if (!found.isAvailable) {
        setStatus("You're on the latest update.");
        return;
      }
      setStatus('Downloading the new update…');
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (err) {
      setStatus(`Couldn't check: ${errorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ gap: space.sm }}>
      <AppText variant="heading">About this app</AppText>
      <AppText variant="caption" color={colors.textMuted}>
        Version {Application.nativeApplicationVersion ?? '?'} ({Application.nativeBuildVersion ?? '?'}) · {Updates.channel || 'no channel'}
      </AppText>
      <AppText variant="caption" color={colors.textMuted}>
        Update {updateId}
        {published ? ` · published ${published}` : ''}
      </AppText>
      {status ? <AppText variant="caption">{status}</AppText> : null}
      <Button title="Check for updates" size="sm" variant="outline" loading={busy} onPress={check} />
    </Card>
  );
}

const styles = StyleSheet.create({
  session: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
