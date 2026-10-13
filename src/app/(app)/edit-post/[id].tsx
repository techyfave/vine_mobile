import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { type Audience, useEditPost } from '@/features/feed/api';
import { useKeyboardHeight } from '@/lib/keyboard';
import { AppText, Button, ErrorText } from '@/ui/components';
import { colors, fonts, radius, space } from '@/ui/theme';

/** Edit your own post's text and audience. Photos can't be swapped after posting. */
export default function EditPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const keyboard = useKeyboardHeight();
  const edit = useEditPost();
  const post = useQuery({
    queryKey: ['post', id],
    queryFn: async () => unwrap(await api.GET('/api/v1/feed/posts/{post_id}/', { params: { path: { post_id: id } } })),
  });
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Audience>('public');

  useEffect(() => {
    if (post.data) {
      setContent(post.data.content);
      setVisibility(post.data.visibility === 'followers' ? 'followers' : 'public');
    }
  }, [post.data]);

  if (post.isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />;

  const hasImage = Boolean(post.data?.media.length);
  const canSave = (content.trim().length > 0 || hasImage) && !edit.isPending;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: keyboard + space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {(['public', 'followers'] as const).map((v) => (
          <Pressable
            key={v}
            accessibilityRole="radio"
            accessibilityState={{ selected: visibility === v }}
            onPress={() => setVisibility(v)}
            style={[styles.pill, visibility === v && styles.pillOn]}
          >
            <AppText variant="caption" color={visibility === v ? colors.white : colors.primary}>
              {v === 'public' ? 'Public' : 'Followers'}
            </AppText>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={content}
        onChangeText={setContent}
        multiline
        autoFocus
        maxLength={10000}
        placeholder="What's on your mind?"
        placeholderTextColor={colors.textMuted}
        style={styles.body}
      />
      {hasImage ? (
        <AppText variant="caption" color={colors.textMuted}>
          Photos stay as they are. To change them, delete the post and share it again.
        </AppText>
      ) : null}
      {edit.error ? <ErrorText>{errorMessage(edit.error)}</ErrorText> : null}
      <Button
        title="Save changes"
        loading={edit.isPending}
        disabled={!canSave}
        onPress={() => edit.mutate({ id, content: content.trim(), visibility }, { onSuccess: () => router.back() })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { minHeight: 160, fontFamily: fonts.regular, fontSize: 18, color: colors.primary, textAlignVertical: 'top' },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
