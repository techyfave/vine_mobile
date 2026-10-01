import { useInfiniteQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { api, type Schemas } from '@/api/client';
import { unwrap } from '@/api/errors';
import { Body, ErrorText } from '@/ui/components';
import { space, useColors } from '@/ui/theme';

type Post = Schemas['PostDetailSchema'];

function PostCard({ post }: { post: Post }) {
  const c = useColors();
  const reactions = Object.values(post.reaction_counts).reduce((a, b) => a + b, 0);
  return (
    <View style={[styles.card, { borderColor: c.border }]}>
      <Text style={[styles.author, { color: c.text }]}>@{post.author.username}</Text>
      {post.content ? <Text style={[styles.content, { color: c.text }]}>{post.content}</Text> : null}
      {post.scripture_reference ? <Text style={{ color: c.muted }}>{post.scripture_reference}</Text> : null}
      <Text style={{ color: c.muted }}>
        {reactions} reactions · {post.comment_count} comments
      </Text>
    </View>
  );
}

export default function HomeFeed() {
  const c = useColors();
  const feed = useInfiniteQuery({
    queryKey: ['feed', 'home'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(await api.GET('/api/v1/feed/', { params: { query: { cursor: pageParam, limit: 20 } } })),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });

  const posts = feed.data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={() => router.push('/settings')}>
              <Text style={{ color: c.primary, fontWeight: '600' }}>Settings</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ padding: space.lg, gap: space.md }}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} />}
        ListEmptyComponent={
          feed.isLoading ? (
            <ActivityIndicator />
          ) : feed.isError ? (
            <ErrorText>Couldn't load your feed. Pull to retry.</ErrorText>
          ) : (
            <Body muted>Nothing here yet. Follow people and churches to fill your feed.</Body>
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: space.lg, gap: space.sm },
  author: { fontWeight: '700' },
  content: { fontSize: 16, lineHeight: 22 },
});
