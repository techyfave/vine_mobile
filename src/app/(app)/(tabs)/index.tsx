import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import type { Post } from '@/features/feed/api';
import { Composer } from '@/features/feed/Composer';
import { PostCard } from '@/features/feed/PostCard';
import { WelcomeModal } from '@/features/feed/WelcomeModal';
import { AppText, Card } from '@/ui/components';
import { TopBar } from '@/ui/TopBar';
import { colors, space } from '@/ui/theme';

const TAB_BAR_SPACE = 110;

export default function HomeFeed() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const feed = useInfiniteQuery({
    queryKey: ['feed', 'home'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(await api.GET('/api/v1/feed/', { params: { query: { cursor: pageParam, limit: 20 } } })),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });

  const hide = useCallback((id: string) => setHidden((s) => new Set(s).add(id)), []);
  const posts = (feed.data?.pages.flatMap((p) => p.results) ?? []).filter((p) => !hidden.has(p.id));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <FlatList<Post>
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} onHide={hide} />}
        ListHeaderComponent={<Composer />}
        contentContainerStyle={{ paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: TAB_BAR_SPACE, gap: space.md }}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colors.primary} />}
        ListEmptyComponent={
          feed.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
          ) : (
            <Card style={{ alignItems: 'center', gap: space.sm }}>
              <AppText variant="heading">{feed.isError ? "Couldn't load your feed" : 'Your feed is quiet'}</AppText>
              <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
                {feed.isError ? 'Pull down to try again.' : 'Follow people and churches to see their posts here.'}
              </AppText>
            </Card>
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
      />
      <WelcomeModal />
    </View>
  );
}
