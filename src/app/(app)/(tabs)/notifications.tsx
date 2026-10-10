import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api, type Schemas } from '@/api/client';
import { unwrap } from '@/api/errors';
import { timeAgo } from '@/lib/time';
import { AppText, Avatar, Button, PressableScale, Skeleton } from '@/ui/components';
import { enter, layout, staggerDelay } from '@/ui/motion';
import { TopBar } from '@/ui/TopBar';
import { colors, radius, space } from '@/ui/theme';

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

  // Opening the tab marks everything read (the unread dot clears).
  useFocusEffect(
    useCallback(() => {
      list.refetch().then(() => markAll.mutate());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const followBack = useMutation({
    mutationFn: async (username: string) =>
      unwrap(await api.POST('/api/v1/users/{username}/follow/', { params: { path: { username } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'list'] }),
  });

  const items = list.data?.pages.flatMap((p) => p.results) ?? [];
  const seen = useRef(new Set<string>());

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <View style={styles.titlePill}>
            <AppText variant="heading">Notifications</AppText>
          </View>
          <PressableScale accessibilityRole="button" accessibilityLabel="Mark all as read" onPress={() => markAll.mutate()} style={styles.morePill}>
            <AppText variant="bodyBold">···</AppText>
          </PressableScale>
        </View>
        <Animated.FlatList<Notification>
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ gap: space.md, paddingBottom: 120 }}
          itemLayoutAnimation={layout}
          renderItem={({ item, index }) => {
            const fresh = !seen.current.has(item.id);
            seen.current.add(item.id);
            return (
              <Animated.View entering={fresh ? enter.rise(staggerDelay(index % 20)) : undefined}>
                <NotificationRow item={item} onFollowBack={(u) => followBack.mutate(u)} following={followBack.isPending} />
              </Animated.View>
            );
          }}
          onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
          ListEmptyComponent={
            list.isLoading ? (
              <View style={{ gap: space.md }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.row, { backgroundColor: colors.subtle }]}>
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

function NotificationRow({
  item,
  onFollowBack,
  following,
}: {
  item: Notification;
  onFollowBack: (username: string) => void;
  following: boolean;
}) {
  const showFollowBack = item.type === 'follow' && item.actor && !item.viewer_follows_actor;
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={() => item.post_id && router.push({ pathname: '/post/[id]', params: { id: item.post_id } })}
      scaleTo={0.98}
      style={[styles.row, !item.is_read && styles.unread]}
    >
      <Avatar uri={item.actor?.profile_picture} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyBold" numberOfLines={2}>
          {item.message}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {timeAgo(item.created_at)}
        </AppText>
      </View>
      {showFollowBack ? (
        <Button title="Follow back" size="sm" loading={following} onPress={() => onFollowBack(item.actor!.username)} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    marginHorizontal: space.md,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    gap: space.md,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  headerRow: { flexDirection: 'row', gap: space.sm },
  titlePill: { flex: 1, backgroundColor: colors.cardMuted, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.md },
  morePill: { width: 52, backgroundColor: colors.cardMuted, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.subtle,
    borderRadius: radius.md,
    padding: space.md,
  },
  unread: { backgroundColor: colors.cardMuted },
});
