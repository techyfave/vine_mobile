import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { type PageFields, useCreatePage, usePageTypes, useTypeHasField } from '@/features/pages/api';
import { useKeyboardHeight } from '@/lib/keyboard';
import { routes } from '@/lib/routes';
import { AppText, Button, Card, ErrorText, Input } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

type PageTypeSlug = PageFields['page_type'];

/** Create a Page. The type can't be changed later (it decides what the Page can do). */
export default function NewPage() {
  const types = usePageTypes();
  const create = useCreatePage();
  const keyboard = useKeyboardHeight();
  const [type, setType] = useState<PageTypeSlug | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [denomination, setDenomination] = useState('');
  const [error, setError] = useState<string>();
  const hasDenomination = useTypeHasField(type ?? undefined, 'denomination');

  function submit() {
    if (!type) return;
    setError(undefined);
    create.mutate(
      { name: name.trim(), page_type: type, description, location, denomination, website: '', phone: '', address: '' },
      {
        onSuccess: (page) => router.replace(routes.page(page.slug)),
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md, paddingBottom: keyboard + space.xl }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Create a Page' }} />
      <Card style={{ gap: space.sm }}>
        <AppText variant="heading">What kind of Page?</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          This can&apos;t be changed later.
        </AppText>
        {(types.data ?? []).map((t) => {
          const selected = t.slug === type;
          return (
            <Pressable
              key={t.slug}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setType(t.slug as PageTypeSlug)}
              style={[styles.choice, selected && styles.choiceOn]}
            >
              <View style={[styles.radio, selected && styles.radioOn]} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{t.label}</AppText>
                {t.description ? (
                  <AppText variant="caption" color={colors.textMuted}>
                    {t.description}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </Card>
      <Card style={{ gap: space.md }}>
        <Input placeholder="Name" value={name} onChangeText={setName} maxLength={255} />
        <Input placeholder="About (optional)" value={description} onChangeText={setDescription} multiline style={{ minHeight: 90, textAlignVertical: 'top' }} />
        <Input placeholder="City / area (optional)" value={location} onChangeText={setLocation} />
        {hasDenomination ? <Input placeholder="Denomination (optional)" value={denomination} onChangeText={setDenomination} /> : null}
      </Card>
      <ErrorText>{error}</ErrorText>
      <Button title="Create Page" onPress={submit} loading={create.isPending} disabled={!type || name.trim().length < 2} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  choiceOn: { borderColor: colors.primary, backgroundColor: colors.subtle },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
});
