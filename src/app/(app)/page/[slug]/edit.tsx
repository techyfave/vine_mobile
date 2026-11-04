import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { type PageDetail, pickAndUploadPageImage, usePage, useTypeHasField, useUpdatePage } from '@/features/pages/api';
import { PageLogo } from '@/features/pages/components';
import { useKeyboardHeight } from '@/lib/keyboard';
import { AppText, Button, Card, ErrorText, Input } from '@/ui/components';
import { colors, space } from '@/ui/theme';

/** Edit a Page's details, photos and who can join. The type and name are fixed (they're checked at verification). */
export default function EditPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = usePage(slug);
  // The form starts from the loaded Page, so it only mounts once the Page is here.
  if (!page.data) return <ActivityIndicator color={colors.primary} style={{ marginTop: space.xl }} />;
  return <PageForm slug={slug} p={page.data} />;
}

function PageForm({ slug, p }: { slug: string; p: PageDetail }) {
  const qc = useQueryClient();
  const update = useUpdatePage(slug);
  const keyboard = useKeyboardHeight();
  const [form, setForm] = useState({
    description: p.description,
    denomination: p.denomination,
    location: p.location,
    address: p.address,
    phone: p.phone,
    website: p.website,
  });
  const [open, setOpen] = useState(p.join_policy === 'open');
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const hasDenomination = useTypeHasField(p.page_type, 'denomination');

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function changeImage(kind: 'logo' | 'cover') {
    setUploading(kind);
    setError(undefined);
    try {
      if (await pickAndUploadPageImage(slug, kind)) await qc.invalidateQueries({ queryKey: ['page', slug] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  function save() {
    setError(undefined);
    update.mutate(
      { ...form, join_policy: open ? 'open' : 'approval' },
      { onSuccess: () => router.back(), onError: (err) => setError(errorMessage(err)) },
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md, paddingBottom: keyboard + space.xl }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Edit Page' }} />
      <Card style={styles.photos}>
        <PageLogo uri={p.logo} name={p.name} size={64} />
        <View style={{ flex: 1, gap: space.sm }}>
          <AppText variant="heading">{p.name}</AppText>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button title="Logo" size="sm" variant="outline" loading={uploading === 'logo'} onPress={() => changeImage('logo')} />
            <Button title="Cover" size="sm" variant="outline" loading={uploading === 'cover'} onPress={() => changeImage('cover')} />
          </View>
        </View>
      </Card>

      <Card style={{ gap: space.md }}>
        <Input placeholder="About" value={form.description} onChangeText={set('description')} multiline style={{ minHeight: 100, textAlignVertical: 'top' }} />
        {hasDenomination ? (
          <Input placeholder="Denomination" value={form.denomination} onChangeText={set('denomination')} />
        ) : null}
        <Input placeholder="City / area" value={form.location} onChangeText={set('location')} />
        <Input placeholder="Address" value={form.address} onChangeText={set('address')} />
        <Input placeholder="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Input placeholder="Website (https://…)" value={form.website} onChangeText={set('website')} autoCapitalize="none" keyboardType="url" />
      </Card>

      <Card style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold">Anyone can join</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {open ? 'People become members as soon as they join.' : 'You approve each request to join.'}
          </AppText>
        </View>
        <Switch value={open} onValueChange={setOpen} trackColor={{ true: colors.link }} />
      </Card>

      <ErrorText>{error}</ErrorText>
      <Button title="Save" onPress={save} loading={update.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
