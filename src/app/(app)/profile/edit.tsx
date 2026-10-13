import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { pickAndUploadProfilePhoto } from '@/features/profile/photos';
import { useKeyboardHeight } from '@/lib/keyboard';
import { AppText, Avatar, Button, Card, ErrorText, Input } from '@/ui/components';
import { colors, space } from '@/ui/theme';

export default function EditProfile() {
  const { user, reloadUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    bio: user?.bio ?? '',
    location: user?.location ?? '',
    denomination: user?.denomination ?? '',
    website: user?.website ?? '',
  });
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const qc = useQueryClient();
  const keyboard = useKeyboardHeight();
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function changePhoto(kind: 'avatar' | 'cover') {
    setUploading(kind);
    setError(undefined);
    try {
      if (await pickAndUploadProfilePhoto(kind)) {
        await reloadUser();
        qc.invalidateQueries({ queryKey: ['profile'] });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      unwrap(await api.PATCH('/api/v1/users/me/', { body: form }));
      await reloadUser();
      qc.invalidateQueries({ queryKey: ['profile'] });
      router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md, paddingBottom: keyboard + space.xl }} keyboardShouldPersistTaps="handled">
      <Card style={{ alignItems: 'center', gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={() => changePhoto('avatar')}>
          <Avatar uri={user?.profile_picture} size={96} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            title={uploading === 'avatar' ? 'Uploading…' : 'Change photo'}
            variant="ghost"
            size="sm"
            onPress={() => changePhoto('avatar')}
            loading={uploading === 'avatar'}
          />
          <Button
            title={uploading === 'cover' ? 'Uploading…' : user?.cover_photo ? 'Change cover' : 'Add cover'}
            variant="ghost"
            size="sm"
            onPress={() => changePhoto('cover')}
            loading={uploading === 'cover'}
          />
        </View>
      </Card>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Input placeholder="First Name" value={form.first_name} onChangeText={set('first_name')} />
          </View>
          <View style={{ flex: 1 }}>
            <Input placeholder="Last Name" value={form.last_name} onChangeText={set('last_name')} />
          </View>
        </View>
        <Input placeholder="Bio" value={form.bio} onChangeText={set('bio')} multiline maxLength={500} style={{ minHeight: 90, textAlignVertical: 'top' }} />
        <Input placeholder="Location" value={form.location} onChangeText={set('location')} />
        <Input placeholder="Church / denomination (optional)" value={form.denomination} onChangeText={set('denomination')} />
        <Input placeholder="Website" value={form.website} onChangeText={set('website')} autoCapitalize="none" keyboardType="url" />
        <AppText variant="caption" color={colors.textMuted}>
          Your username is @{user?.username}
        </AppText>
        <ErrorText>{error}</ErrorText>
        <Button title="Save" onPress={save} loading={saving} />
      </Card>
    </ScrollView>
  );
}
