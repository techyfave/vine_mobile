import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import type { Post } from '@/features/feed/api';
import { PostCard, PostCardSkeleton } from '@/features/feed/PostCard';
import { FollowButton } from '@/features/people/follow';
import { pickAndUploadProfilePhoto } from '@/features/profile/photos';
import { routes } from '@/lib/routes';
import { remoteImage } from '@/lib/media';
import { displayName } from '@/lib/time';
import { AppText, Avatar, Button, Card, PressableScale } from '@/ui/components';
import { ImageViewer } from '@/ui/ImageViewer';
import { enter, exit, layout, staggerDelay } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

const COVER_HEIGHT = 170;
const AVATAR = 104;

/** A person's profile: cover, photo, details and their posts. View-only until "Edit profile". */
export default function Profile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user: me, reloadUser } = useAuth();
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);

  const profile = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => unwrap(await api.GET('/api/v1/users/{username}/', { params: { path: { username } } })),
  });
  const posts = useInfiniteQuery({
    queryKey: ['feed', 'user', username],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET('/api/v1/feed/users/{username}/', {
          params: { path: { username }, query: { cursor: pageParam, limit: 20 } },
        }),
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });

  const p = profile.data;
  const isSelf = p?.relationship.is_self ?? me?.username === username;

  async function changePhoto(kind: 'avatar' | 'cover') {
    setUploading(kind);
    try {
      if (await pickAndUploadProfilePhoto(kind)) {
        await reloadUser();
        await qc.invalidateQueries({ queryKey: ['profile', username] });
      }
    } catch (err) {
      Alert.alert("Couldn't upload photo", errorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  const items = posts.data?.pages.flatMap((pg) => pg.results) ?? [];
  const title = p ? displayName(p) : '';

  const header = (
    <View>
      {/* Cover */}
      <Pressable
        onPress={() => p?.cover_photo && setViewing(p.cover_photo)}
        disabled={!p?.cover_photo}
        accessibilityLabel={p?.cover_photo ? 'View cover photo' : undefined}
        style={styles.cover}
      >
        {p?.cover_photo ? (
          <Image source={remoteImage(p.cover_photo)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : null}
        {isSelf ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={p?.cover_photo ? 'Change cover photo' : 'Add cover photo'}
            onPress={() => changePhoto('cover')}
            style={styles.coverButton}
          >
            {uploading === 'cover' ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <AppText variant="caption">{p?.cover_photo ? 'Change cover' : 'Add cover'}</AppText>
            )}
          </PressableScale>
        ) : null}
      </Pressable>

      {/* Photo + details */}
      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <Pressable
            onPress={() => p?.profile_picture && setViewing(p.profile_picture)}
            disabled={!p?.profile_picture}
            accessibilityLabel={p?.profile_picture ? 'View profile photo' : undefined}
            style={styles.avatarRing}
          >
            <Avatar uri={p?.profile_picture ?? (isSelf ? me?.profile_picture : null)} size={AVATAR} />
          </Pressable>
          {isSelf ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              onPress={() => changePhoto('avatar')}
              scaleTo={0.9}
              style={styles.avatarBadge}
            >
              {uploading === 'avatar' ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <AppText variant="caption" color={colors.white}>
                  ✎
                </AppText>
              )}
            </PressableScale>
          ) : null}
        </View>

        {p ? (
          <Animated.View entering={enter.rise()} style={{ gap: space.sm }}>
            <View>
              <AppText variant="display">{title}</AppText>
              <AppText color={colors.textMuted}>@{p.username}</AppText>
            </View>
            {p.bio ? <AppText>{p.bio}</AppText> : null}
            <View style={{ gap: 2 }}>
              {p.location ? <Meta label="Lives in" value={p.location} /> : null}
              {p.denomination ? <Meta label="Church" value={p.denomination} /> : null}
              {p.website ? <Meta label="Website" value={p.website} /> : null}
            </View>
            <View style={styles.stats}>
              <Stat
                value={p.follower_count}
                label={p.follower_count === 1 ? 'Follower' : 'Followers'}
                onPress={() => router.push(routes.people(p.username, 'followers'))}
              />
              <Stat value={p.following_count} label="Following" onPress={() => router.push(routes.people(p.username, 'following'))} />
            </View>
            {isSelf ? (
              <Button title="Edit profile" variant="outline" onPress={() => router.push('/profile/edit')} />
            ) : (
              <FollowButton username={p.username} following={p.relationship.following} followedBy={p.relationship.followed_by} />
            )}
          </Animated.View>
        ) : profile.isError ? (
          <AppText color={colors.textMuted}>This profile isn&apos;t available.</AppText>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>

      <AppText variant="heading" style={styles.sectionTitle}>
        Posts
      </AppText>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: isSelf ? 'Your profile' : title || 'Profile' }} />
      <Animated.FlatList<Post>
        data={items}
        keyExtractor={(post) => post.id}
        itemLayoutAnimation={layout}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <Animated.View entering={enter.rise(staggerDelay(index % 20))} exiting={exit.fade()} style={{ paddingHorizontal: space.md }}>
            <PostCard post={item} />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        onEndReached={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={profile.isRefetching || posts.isRefetching}
            onRefresh={() => {
              profile.refetch();
              posts.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          posts.isLoading ? (
            <View style={{ paddingHorizontal: space.md }}>
              <PostCardSkeleton />
            </View>
          ) : (
            <Card style={{ marginHorizontal: space.md, alignItems: 'center', gap: space.sm }}>
              <AppText variant="heading">{isSelf ? 'You haven’t posted yet' : 'No posts yet'}</AppText>
              {isSelf ? <Button title="Create a post" size="sm" onPress={() => router.push('/create-post')} /> : null}
            </Card>
          )
        }
        ListFooterComponent={posts.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ margin: space.lg }} /> : null}
      />
      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <AppText variant="caption" color={colors.textMuted}>
      {label} <AppText variant="caption">{value}</AppText>
    </AppText>
  );
}

function Stat({ value, label, onPress }: { value: number; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link" accessibilityLabel={`${value} ${label}`}>
      <AppText variant="caption" color={colors.textMuted}>
        <AppText variant="bodyBold">{value}</AppText> {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: { height: COVER_HEIGHT, backgroundColor: colors.backgroundLight, overflow: 'hidden' },
  coverButton: {
    position: 'absolute',
    right: space.md,
    bottom: space.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  identity: {
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    gap: space.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatarWrap: { marginTop: -AVATAR / 2, alignSelf: 'flex-start' },
  avatarRing: { borderRadius: AVATAR, borderWidth: 4, borderColor: colors.card, backgroundColor: colors.card },
  avatarBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: space.lg },
  sectionTitle: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md },
});
