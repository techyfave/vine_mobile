import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { api, type Schemas } from '@/api/client';
import { unwrap } from '@/api/errors';
import { timeAgo } from '@/lib/time';
import { AppText, Avatar, Button } from '@/ui/components';
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <View style={styles.titlePill}>
            <AppText variant="heading">Notifications</AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Mark all as read" onPress={() => markAll.mutate()} style={styles.morePill}>
            <AppText variant="bodyBold">···</AppText>
          </Pressable>
        </View>
        <FlatList<Notification>
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ gap: space.md, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <NotificationRow item={item} onFollowBack={(u) => followBack.mutate(u)} following={followBack.isPending} />
          )}
          onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && list.fetchNextPage()}
          ListEmptyComponent={
            list.isLoading ? (
              <ActivityIndicator color={colors.primary} />
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
    <Pressable
      accessibilityRole="button"
      onPress={() => item.post_id && router.push({ pathname: '/post/[id]', params: { id: item.post_id } })}
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
    </Pressable>
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
