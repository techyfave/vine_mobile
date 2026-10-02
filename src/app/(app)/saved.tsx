import { useInfiniteQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList } from 'react-native';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import type { Post } from '@/features/feed/api';
import { PostCard } from '@/features/feed/PostCard';
import { AppText } from '@/ui/components';
import { colors, space } from '@/ui/theme';

export default function Saved() {
  const q = useInfiniteQuery({
    queryKey: ['feed', 'saved'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(await api.GET('/api/v1/feed/bookmarks/', { params: { query: { cursor: pageParam, limit: 20 } } })),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  return (
    <FlatList<Post>
      data={q.data?.pages.flatMap((p) => p.results) ?? []}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PostCard post={item} />}
      contentContainerStyle={{ padding: space.md, gap: space.md }}
      onEndReached={() => q.hasNextPage && q.fetchNextPage()}
      ListEmptyComponent={
        q.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
            Posts you save will show up here.
          </AppText>
        )
      }
    />
  );
}
