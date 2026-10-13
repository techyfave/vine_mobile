import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, type Schemas } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { PostCard } from '@/features/feed/PostCard';
import { useKeyboardHeight } from '@/lib/keyboard';
import { routes } from '@/lib/routes';
import { displayName, timeAgo } from '@/lib/time';
import { AppText, Avatar, Button, ErrorText } from '@/ui/components';
import { colors, fonts, radius, space } from '@/ui/theme';

type Comment = Schemas['CommentSchema'];

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const keyboard = useKeyboardHeight();

  const post = useQuery({
    queryKey: ['post', id],
    queryFn: async () => unwrap(await api.GET('/api/v1/feed/posts/{post_id}/', { params: { path: { post_id: id } } })),
  });
  const comments = useInfiniteQuery({
    queryKey: ['comments', id],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET('/api/v1/feed/posts/{post_id}/comments/', {
          params: { path: { post_id: id }, query: { cursor: pageParam, limit: 30 } },
        }),
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const send = useMutation({
    mutationFn: async () =>
      unwrap(await api.POST('/api/v1/feed/posts/{post_id}/comments/', { params: { path: { post_id: id } }, body: { body: body.trim() } })),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['comments', id] });
      qc.invalidateQueries({ queryKey: ['post', id] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  if (post.isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />;
  if (!post.data) {
    return (
      <AppText color={colors.textMuted} style={{ textAlign: 'center', marginTop: space.xxl }}>
        This post isn&apos;t available.
      </AppText>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList<Comment>
        data={comments.data?.pages.flatMap((p) => p.results) ?? []}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={<PostCard post={post.data} inDetail />}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Pressable onPress={() => router.push(routes.profile(item.author.username))} accessibilityRole="link" accessibilityLabel={`${displayName(item.author)}'s profile`}>
              <Avatar uri={item.author.profile_picture} size={34} />
            </Pressable>
            <View style={styles.bubble}>
              <AppText variant="bodyBold" onPress={() => router.push(routes.profile(item.author.username))}>
                {displayName(item.author)}
              </AppText>
              <AppText>{item.body}</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {timeAgo(item.created_at)}
              </AppText>
            </View>
          </View>
        )}
        onEndReached={() => comments.hasNextPage && comments.fetchNextPage()}
        contentContainerStyle={{ padding: space.md, gap: space.md }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />
      {/* Sits on top of the keyboard while typing (Android draws edge to edge, so nothing resizes for us). */}
      <View style={[styles.composer, { paddingBottom: keyboard > 0 ? keyboard + space.sm : insets.bottom + space.sm }]}>
        {send.error ? (
          <View style={{ position: 'absolute', left: space.md, right: space.md, top: -22 }}>
            <ErrorText>{errorMessage(send.error)}</ErrorText>
          </View>
        ) : null}
        <Avatar uri={user?.profile_picture} size={34} />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={`Comment as ${user ? displayName(user) : ''}`}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={5000}
        />
        <Button title="Post" size="sm" onPress={() => send.mutate()} loading={send.isPending} disabled={!body.trim()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: space.md, gap: 2 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.primary,
  },
});
