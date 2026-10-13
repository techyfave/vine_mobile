import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { type Audience, useQuoteRepost } from '@/features/feed/api';
import { EmbeddedPost } from '@/features/feed/EmbeddedPost';
import { useKeyboardHeight } from '@/lib/keyboard';
import { displayName } from '@/lib/time';
import { AppText, Avatar, Button, ErrorText } from '@/ui/components';
import { colors, fonts, radius, space } from '@/ui/theme';

/** Repost with your own words. The original shows underneath, the way your followers will see it. */
export default function QuoteRepost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const keyboard = useKeyboardHeight();
  const quote = useQuoteRepost();
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<Audience>('public');
  const post = useQuery({
    queryKey: ['post', id],
    queryFn: async () => unwrap(await api.GET('/api/v1/feed/posts/{post_id}/', { params: { path: { post_id: id } } })),
  });
  // Reposting a repost shares the original, so preview the original.
  const original = post.data?.post_type === 'repost' ? post.data.repost_of : post.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: keyboard + space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.author}>
        <Avatar uri={user?.profile_picture} size={40} />
        <View style={{ gap: 4 }}>
          <AppText variant="heading">{user ? displayName(user) : ''}</AppText>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {(['public', 'followers'] as const).map((v) => (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityState={{ selected: visibility === v }}
                onPress={() => setVisibility(v)}
                style={[styles.chip, visibility === v && styles.chipOn]}
              >
                <AppText variant="caption" color={visibility === v ? colors.white : colors.primary}>
                  {v === 'public' ? 'Public' : 'Followers'}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        autoFocus
        maxLength={2000}
        placeholder="Say something about this…"
        placeholderTextColor={colors.textMuted}
        style={styles.body}
      />
      {post.isLoading ? <ActivityIndicator color={colors.primary} /> : <EmbeddedPost post={original} />}
      {quote.error ? <ErrorText>{errorMessage(quote.error)}</ErrorText> : null}
      <Button
        title="Repost"
        loading={quote.isPending}
        disabled={!note.trim() || !original}
        onPress={() => quote.mutate({ postId: id, note: note.trim(), visibility }, { onSuccess: () => router.back() })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  author: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  body: { minHeight: 110, fontFamily: fonts.regular, fontSize: 18, color: colors.primary, textAlignVertical: 'top' },
});
