import { useInfiniteQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import { PersonRow } from '@/features/people/PersonRow';
import { AppText, Card, PressableScale, Skeleton } from '@/ui/components';
import { enter, staggerDelay } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

type Tab = 'followers' | 'following';

/** Someone's followers and the people they follow, with Follow buttons. */
export default function People() {
  const { username, tab: startTab } = useLocalSearchParams<{ username: string; tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(startTab === 'following' ? 'following' : 'followers');

  const list = useInfiniteQuery({
    queryKey: ['people', username, tab],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params = { params: { path: { username }, query: { cursor: pageParam, limit: 30 } } };
      return tab === 'followers'
        ? unwrap(await api.GET('/api/v1/users/{username}/followers/', params))
        : unwrap(await api.GET('/api/v1/users/{username}/following/', params));
    },
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const rows = list.data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `@${username}` }} />
      <View style={styles.tabs}>
        {(['followers', 'following'] as const).map((t) => (
          <PressableScale
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            onPress={() => setTab(t)}
            scaleTo={0.96}
            style={[styles.tab, tab === t && styles.tabOn]}
          >
            <AppText variant="caption" color={tab === t ? colors.white : colors.primary}>
              {t === 'followers' ? 'Followers' : 'Following'}
            </AppText>
          </PressableScale>
        ))}
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.user.id}
        contentContainerStyle={{ padding: space.md, gap: space.sm }}
        renderItem={({ item, index }) => (
          <Animated.View entering={enter.rise(staggerDelay(index % 20))}>
            <PersonRow person={item.user} />
          </Animated.View>
        )}
        onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
        ListEmptyComponent={
          list.isLoading ? (
            <View style={{ gap: space.sm }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={68} round={radius.lg} />
              ))}
            </View>
          ) : (
            <Card style={{ alignItems: 'center' }}>
              <AppText color={colors.textMuted}>{tab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</AppText>
            </Card>
          )
        }
        ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.md, paddingTop: space.md },
  tab: { paddingHorizontal: space.lg, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.card },
  tabOn: { backgroundColor: colors.primary },
});
