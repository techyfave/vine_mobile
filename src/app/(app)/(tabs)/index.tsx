import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import type { Post } from '@/features/feed/api';
import { Composer } from '@/features/feed/Composer';
import { PostCard, PostCardSkeleton } from '@/features/feed/PostCard';
import { WelcomeModal } from '@/features/feed/WelcomeModal';
import { AppText, Button, Card, PressableScale } from '@/ui/components';
import { TopBar } from '@/ui/TopBar';
import { enter, exit, layout, staggerDelay } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

const TAB_BAR_SPACE = 110;

type FeedTab = 'home' | 'lifts' | 'testimonies';
const TABS: { value: FeedTab; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'lifts', label: '🙏 Lifts' },
  { value: 'testimonies', label: '🙌 Testimonies' },
];

export default function HomeFeed() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<FeedTab>('home');
  const feed = useInfiniteQuery({
    queryKey: ['feed', tab === 'home' ? 'home' : 'lifts', tab],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      tab === 'home'
        ? unwrap(await api.GET('/api/v1/feed/', { params: { query: { cursor: pageParam, limit: 20 } } }))
        : unwrap(
            await api.GET('/api/v1/feed/lifts/', {
              params: { query: { cursor: pageParam, limit: 20, answered: tab === 'testimonies' ? true : undefined } },
            }),
          ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });

  const hide = useCallback((id: string) => setHidden((s) => new Set(s).add(id)), []);
  // Posts rise in the first time they appear, one after another; scrolling back never replays it.
  const seen = useRef(new Set<string>());
  const posts = (feed.data?.pages.flatMap((p) => p.results) ?? []).filter((p) => !hidden.has(p.id));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <Animated.FlatList<Post>
        data={posts}
        keyExtractor={(p) => p.id}
        itemLayoutAnimation={layout}
        renderItem={({ item, index }) => {
          const fresh = !seen.current.has(item.id);
          seen.current.add(item.id);
          return (
            <Animated.View entering={fresh ? enter.rise(staggerDelay(index % 20)) : undefined} exiting={exit.fade()}>
              <PostCard post={item} onHide={hide} />
            </Animated.View>
          );
        }}
        ListHeaderComponent={
          <View style={{ gap: space.md }}>
            <Composer />
            <View style={styles.tabs} accessibilityRole="tablist">
              {TABS.map((t) => (
                <PressableScale
                  key={t.value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === t.value }}
                  onPress={() => setTab(t.value)}
                  scaleTo={0.96}
                  style={[styles.tab, tab === t.value && styles.tabOn]}
                >
                  <AppText variant="caption" color={tab === t.value ? colors.white : colors.primary}>
                    {t.label}
                  </AppText>
                </PressableScale>
              ))}
            </View>
            {tab === 'lifts' ? (
              <Card style={styles.liftIntro}>
                <AppText variant="heading">Stand with someone today</AppText>
                <AppText color={colors.textMuted}>
                  People here asked for prayer or support. Tap 🙏 to pray for them or 🤝 to let them know you're with them.
                </AppText>
                <Button title="Ask for a Lift" variant="outline" size="sm" onPress={() => router.push({ pathname: '/create-post', params: { lift: '1' } })} />
              </Card>
            ) : null}
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: TAB_BAR_SPACE, gap: space.md }}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colors.primary} />}
        ListEmptyComponent={
          feed.isLoading ? (
            <View style={{ gap: space.md }}>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </View>
          ) : (
            <Card style={{ alignItems: 'center', gap: space.sm }}>
              <AppText variant="heading">{feed.isError ? "Couldn't load your feed" : EMPTY[tab].title}</AppText>
              <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
                {feed.isError ? 'Pull down to try again.' : EMPTY[tab].body}
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

const EMPTY: Record<FeedTab, { title: string; body: string }> = {
  home: { title: 'Your feed is quiet', body: 'Follow people and churches to see their posts here.' },
  lifts: { title: 'No Lifts right now', body: 'When people ask for prayer or support, they show up here.' },
  testimonies: { title: 'No testimonies yet', body: 'When a Lift is answered, the story shows up here.' },
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: space.sm },
  tab: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  tabOn: { backgroundColor: colors.primary },
  liftIntro: { gap: space.sm, backgroundColor: colors.liftSoft, borderWidth: 1, borderColor: colors.liftBorder },
});
