import { useInfiniteQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import { routes } from '@/lib/routes';
import { displayName, timeAgo } from '@/lib/time';
import { AppText, Avatar, Card, Skeleton } from '@/ui/components';
import { enter, staggerDelay } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

/** Everyone praying for or standing with someone on a Lift. */
export default function LiftPeople() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const people = useInfiniteQuery({
    queryKey: ['lift-people', id],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET('/api/v1/feed/posts/{post_id}/lift/people/', {
          params: { path: { post_id: id }, query: { cursor: pageParam, limit: 30 } },
        }),
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const rows = people.data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.user.id}
      contentContainerStyle={{ padding: space.md, gap: space.sm }}
      renderItem={({ item, index }) => (
        <Animated.View entering={enter.rise(staggerDelay(index))}>
          <Pressable style={styles.row} onPress={() => router.push(routes.profile(item.user.username))} accessibilityRole="link">
            <Avatar uri={item.user.profile_picture} size={44} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" numberOfLines={1}>
                {displayName(item.user)}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {timeAgo(item.created_at)}
              </AppText>
            </View>
            <View style={styles.kind}>
              <AppText variant="caption" color={colors.lift}>
                {item.kind === 'pray' ? '🙏 Praying' : '🤝 With you'}
              </AppText>
            </View>
          </Pressable>
        </Animated.View>
      )}
      onEndReached={() => people.hasNextPage && !people.isFetchingNextPage && people.fetchNextPage()}
      ListEmptyComponent={
        people.isLoading ? (
          <View style={{ gap: space.sm }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={64} round={radius.lg} />
            ))}
          </View>
        ) : (
          <Card style={{ alignItems: 'center' }}>
            <AppText color={colors.textMuted}>No one yet.</AppText>
          </Card>
        )
      }
      ListFooterComponent={people.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md },
  kind: { backgroundColor: colors.liftSoft, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 3 },
});
