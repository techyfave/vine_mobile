import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { api, uploadForm } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
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
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function changePhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    const asset = res.canceled ? null : res.assets[0];
    if (!asset) return;
    setUploading(true);
    setError(undefined);
    try {
      await uploadForm('/api/v1/users/me/avatar/', () => {
        const body = new FormData();
        body.append('file', { uri: asset.uri, name: asset.fileName ?? 'avatar.jpg', type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob);
        return body;
      });
      await reloadUser();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      unwrap(await api.PATCH('/api/v1/users/me/', { body: form }));
      await reloadUser();
      router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }} keyboardShouldPersistTaps="handled">
      <Card style={{ alignItems: 'center', gap: space.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={changePhoto}>
          <Avatar uri={user?.profile_picture} size={96} />
        </Pressable>
        <Button title={uploading ? 'Uploading…' : 'Change photo'} variant="ghost" size="sm" onPress={changePhoto} loading={uploading} />
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
