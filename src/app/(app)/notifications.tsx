import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api, type Schemas } from '@/api/client';
import { unwrap } from '@/api/errors';
import { FollowButton } from '@/features/people/follow';
import { routes } from '@/lib/routes';
import { timeAgo } from '@/lib/time';
import { AppText, Avatar, PressableScale, Skeleton } from '@/ui/components';
import { enter, layout, staggerDelay } from '@/ui/motion';
import { colors, radius, space, stroke } from '@/ui/theme';

type Notification = Schemas['NotificationSchema'];

export default function Notifications() {
  const qc = useQueryClient();
  const list = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(await api.GET('/api/v1/notifications/', { params: { query: { cursor: pageParam, limit: 20 } } })),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });

  const markAll = useMutation({
    mutationFn: async () => unwrap(await api.POST('/api/v1/notifications/read/', { body: {} })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Opening the screen marks everything read (the unread dot clears).
  useFocusEffect(
    useCallback(() => {
      list.refetch().then(() => markAll.mutate());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const items = list.data?.pages.flatMap((p) => p.results) ?? [];
  const seen = useRef(new Set<string>());

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PressableScale accessibilityRole="button" onPress={() => markAll.mutate()} style={styles.markAll}>
              <AppText variant="label" style={{ fontSize: 14 }}>
                Mark all read
              </AppText>
            </PressableScale>
          ),
        }}
      />
      <View style={styles.sheet}>
        <Animated.FlatList<Notification>
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ gap: space.sm, paddingBottom: space.xxxl }}
          itemLayoutAnimation={layout}
          renderItem={({ item, index }) => {
            const fresh = !seen.current.has(item.id);
            seen.current.add(item.id);
            return (
              <Animated.View entering={fresh ? enter.rise(staggerDelay(index % 20)) : undefined}>
                <NotificationRow item={item} />
              </Animated.View>
            );
          }}
          onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
          ListEmptyComponent={
            list.isLoading ? (
              <View style={{ gap: space.md }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={styles.row}>
                    <Skeleton width={40} height={40} round={20} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton width="80%" height={12} />
                      <Skeleton width="30%" height={10} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <AppText color={colors.textMuted} style={{ textAlign: 'center', marginTop: space.xl }}>
                No notifications yet.
              </AppText>
            )
          }
        />
      </View>
    </View>
  );
}

function NotificationRow({ item }: { item: Notification }) {
  const isFollow = item.type === 'follow';
  const open = () => {
    if (item.post_id) router.push({ pathname: '/post/[id]', params: { id: item.post_id } });
    else if (item.page_slug) router.push(routes.page(item.page_slug));
    else if (item.actor) router.push(routes.profile(item.actor.username));
  };
  return (
    <PressableScale accessibilityRole="button" onPress={open} scaleTo={0.98} style={[styles.row, !item.is_read && styles.unread]}>
      <Pressable
        onPress={() => item.actor && router.push(routes.profile(item.actor.username))}
        disabled={!item.actor}
        accessibilityRole="link"
        accessibilityLabel="Open profile"
      >
        <Avatar uri={item.actor?.profile_picture} size={40} />
      </Pressable>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyBold" numberOfLines={2}>
          {item.message}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {timeAgo(item.created_at)}
        </AppText>
      </View>
      {isFollow && item.actor ? (
        <FollowButton username={item.actor.username} following={Boolean(item.viewer_follows_actor)} followedBy size="sm" />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: space.md, paddingTop: space.sm },
  markAll: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: stroke,
    borderColor: colors.border,
    padding: space.md,
  },
  /** Unread rows get the full ink outline; read ones a soft border. */
  unread: { borderColor: colors.outline, backgroundColor: colors.white },
});
