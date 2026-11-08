import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { errorMessage } from '@/api/errors';
import type { Post } from '@/features/feed/api';
import { PostCard, PostCardSkeleton } from '@/features/feed/PostCard';
import {
  type Announcement,
  can,
  pickAndUploadPageImage,
  useAnnouncements,
  useFollowPage,
  useJoinPage,
  useLeavePage,
  useNotificationPrefs,
  useOrganization,
  usePage,
  usePageFeed,
  usePageMe,
  useSetNotificationPrefs,
} from '@/features/pages/api';
import { AnnouncementCard, PageLogo, PageRow, pageTypeLabel, Tabs, VerifiedMark } from '@/features/pages/components';
import { remoteImage } from '@/lib/media';
import { routes } from '@/lib/routes';
import { ActionSheet, type SheetAction } from '@/ui/ActionSheet';
import { AppText, Button, Card, PressableScale } from '@/ui/components';
import { ImageViewer } from '@/ui/ImageViewer';
import { enter, exit, layout, staggerDelay } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

const COVER_HEIGHT = 170;
const LOGO = 96;

type Tab = 'posts' | 'announcements' | 'about' | 'branches';
type Item = { key: string; post?: Post; announcement?: Announcement };

/** A church (or any) Page: cover, logo, follow/join, then its posts, announcements, details and branches. */
export default function PageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const qc = useQueryClient();
  const page = usePage(slug);
  const me = usePageMe(slug);
  const org = useOrganization(slug);
  const [tab, setTab] = useState<Tab>('posts');
  const feed = usePageFeed(slug);
  const announcements = useAnnouncements(slug, tab === 'announcements');
  const follow = useFollowPage(slug);
  const join = useJoinPage(slug);
  const leave = useLeavePage(slug);
  const [sheet, setSheet] = useState<'manage' | 'membership' | 'alerts' | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);

  const p = page.data;
  const m = me.data;
  const canEdit = can(m, 'page.edit');
  const canAnnounce = can(m, 'announce.own') || can(m, 'announce.org');
  const canManageMembers = can(m, 'page.members.manage');
  const hasFeature = (capability: string) => Boolean(m?.capabilities.includes(capability));
  const canManageBranches = hasFeature('hierarchy') && (can(m, 'org.branches.manage') || Boolean(m?.roles.includes('owner')));
  const canPost = can(m, 'posts.publish');
  const isOwner = Boolean(m?.roles.includes('owner'));
  const hasAlerts = hasFeature('announcements') || hasFeature('live');
  const isMember = m?.membership === 'approved';
  const banned = m?.membership === 'banned';
  const fail = (title: string) => (err: unknown) => Alert.alert(title, errorMessage(err));

  async function changeImage(kind: 'logo' | 'cover') {
    setUploading(kind);
    try {
      if (await pickAndUploadPageImage(slug, kind)) await qc.invalidateQueries({ queryKey: ['page', slug] });
    } catch (err) {
      Alert.alert("Couldn't upload photo", errorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  const manageActions: SheetAction[] = [
    ...(canAnnounce ? [{ label: 'Post an announcement', onPress: () => router.push(routes.pageAnnounce(slug)) }] : []),
    ...(canManageMembers ? [{ label: 'Members & requests', onPress: () => router.push(routes.pageMembers(slug)) }] : []),
    ...(canManageBranches ? [{ label: 'Branches', hint: 'Campuses and your organization', onPress: () => router.push(routes.pageBranches(slug)) }] : []),
    ...(canEdit ? [{ label: 'Edit Page', onPress: () => router.push(routes.pageEdit(slug)) }] : []),
  ];

  const membershipActions: SheetAction[] =
    m?.membership === 'pending'
      ? [{ label: 'Withdraw request', destructive: true, onPress: () => leave.mutate(undefined, { onError: fail("Couldn't withdraw") }) }]
      : [
          { label: 'Notification settings', onPress: () => setSheet('alerts') },
          {
            label: `Leave ${p?.name ?? 'this Page'}`,
            destructive: true,
            onPress: () =>
              Alert.alert(`Leave ${p?.name}?`, 'You will stop seeing posts and announcements for members.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => leave.mutate(undefined, { onError: fail("Couldn't leave") }) },
              ]),
          },
        ];

  const showBranches = Boolean(org.data);
  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    ...(hasFeature('announcements') ? [{ key: 'announcements' as Tab, label: 'Announcements' }] : []),
    { key: 'about', label: 'About' },
    ...(showBranches ? [{ key: 'branches' as Tab, label: 'Branches' }] : []),
  ];

  const items: Item[] =
    tab === 'posts'
      ? (feed.data?.pages.flatMap((pg) => pg.results) ?? []).map((post) => ({ key: post.id, post }))
      : tab === 'announcements'
        ? (announcements.data ?? []).map((a) => ({ key: a.id, announcement: a }))
        : [];

  const header = (
    <View>
      <Pressable
        onPress={() => p?.cover_photo && setViewing(p.cover_photo)}
        disabled={!p?.cover_photo}
        accessibilityLabel={p?.cover_photo ? 'View cover photo' : undefined}
        style={styles.cover}
      >
        {p?.cover_photo ? (
          <Image source={remoteImage(p.cover_photo)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : null}
        {canEdit ? (
          <PressableScale accessibilityRole="button" onPress={() => changeImage('cover')} style={styles.coverButton}>
            {uploading === 'cover' ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <AppText variant="caption">{p?.cover_photo ? 'Change cover' : 'Add cover'}</AppText>
            )}
          </PressableScale>
        ) : null}
      </Pressable>

      <View style={styles.identity}>
        <View style={styles.logoWrap}>
          <Pressable
            onPress={() => (canEdit ? changeImage('logo') : p?.logo && setViewing(p.logo))}
            accessibilityLabel={canEdit ? 'Change logo' : 'View logo'}
            style={styles.logoRing}
          >
            {uploading === 'logo' ? (
              <View style={[styles.logoLoading, { width: LOGO, height: LOGO }]}>
                <ActivityIndicator color={colors.white} />
              </View>
            ) : (
              <PageLogo uri={p?.logo} name={p?.name ?? ''} size={LOGO} />
            )}
          </Pressable>
        </View>

        {p ? (
          <Animated.View entering={enter.rise()} style={{ gap: space.sm }}>
            <View style={styles.titleRow}>
              <AppText variant="display" style={{ flexShrink: 1 }}>
                {p.name}
              </AppText>
              {p.is_verified ? <VerifiedMark size={18} /> : null}
            </View>
            <AppText color={colors.textMuted}>
              {[pageTypeLabel(p.page_type), p.denomination, p.location].filter(Boolean).join(' · ')}
            </AppText>
            {p.hq ? (
              <AppText variant="caption" color={colors.textMuted}>
                Part of{' '}
                <AppText variant="caption" color={colors.link} onPress={() => router.push(routes.page(p.hq!.slug))}>
                  {p.hq.name}
                </AppText>
              </AppText>
            ) : null}
            <View style={styles.stats}>
              {p.has_members ? (
                <Pressable
                  hitSlop={8}
                  accessibilityRole="link"
                  onPress={() =>
                    isMember || canManageMembers
                      ? router.push(routes.pageMembers(slug))
                      : Alert.alert('Members', 'Only members can see who belongs to this Page.')
                  }
                >
                  <AppText variant="caption" color={colors.textMuted}>
                    <AppText variant="bodyBold">{p.member_count}</AppText> {p.member_count === 1 ? 'Member' : 'Members'}
                  </AppText>
                </Pressable>
              ) : null}
              <AppText variant="caption" color={colors.textMuted}>
                <AppText variant="bodyBold">{p.follower_count}</AppText> {p.follower_count === 1 ? 'Follower' : 'Followers'}
              </AppText>
            </View>

            {m && !banned && !(isOwner && !p.has_members) ? (
              <View style={styles.actions}>
                {isOwner ? null : (
                  <Button
                    style={{ flex: 1 }}
                    title={m.following ? 'Following' : 'Follow'}
                    variant={m.following ? 'outline' : 'primary'}
                    loading={follow.isPending}
                    onPress={() => follow.mutate(!m.following, { onError: fail("Couldn't update") })}
                  />
                )}
                {!p.has_members ? null : m.membership ? (
                  <Button
                    style={{ flex: 1 }}
                    title={m.membership === 'pending' ? 'Requested' : 'Member ✓'}
                    variant="outline"
                    loading={leave.isPending}
                    onPress={() => setSheet('membership')}
                  />
                ) : (
                  <Button
                    style={{ flex: 1 }}
                    title={p.join_policy === 'open' ? 'Join' : 'Request to join'}
                    variant="outline"
                    loading={join.isPending}
                    onPress={() =>
                      join.mutate(undefined, {
                        onSuccess: (r) =>
                          r.status === 'pending' &&
                          Alert.alert('Request sent', `${p.name} will review your request to join.`),
                        onError: fail("Couldn't join"),
                      })
                    }
                  />
                )}
              </View>
            ) : null}
            {canPost ? (
              <Button title="Create a post" onPress={() => router.push(routes.pagePost(slug, p.name, p.has_members))} />
            ) : null}
            {manageActions.length ? (
              <Button title="Manage Page" variant="ghost" size="sm" onPress={() => setSheet('manage')} />
            ) : null}
          </Animated.View>
        ) : page.isError ? (
          <AppText color={colors.textMuted}>This Page isn&apos;t available.</AppText>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>

      {p ? (
        <View style={styles.tabsWrap}>
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          {tab === 'announcements' && canAnnounce ? (
            <Button title="Post an announcement" size="sm" onPress={() => router.push(routes.pageAnnounce(slug))} />
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const empty =
    tab === 'posts' ? (
      feed.isLoading ? (
        <PostCardSkeleton />
      ) : (
        <EmptyCard title="No posts yet" />
      )
    ) : tab === 'announcements' ? (
      announcements.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <EmptyCard
          title="No announcements"
          body={isMember ? undefined : 'Announcements are shared with members. Join to see them.'}
        />
      )
    ) : tab === 'about' && p ? (
      <About page={p} />
    ) : tab === 'branches' && org.data ? (
      <View style={{ gap: space.sm }}>
        <AppText variant="caption" color={colors.textMuted}>
          Headquarters
        </AppText>
        <PageRow page={org.data.hq} />
        <AppText variant="caption" color={colors.textMuted} style={{ marginTop: space.sm }}>
          {org.data.branches.length === 1 ? '1 branch' : `${org.data.branches.length} branches`}
        </AppText>
        {org.data.branches.map((b) => (
          <PageRow key={b.id} page={b} />
        ))}
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: p?.name ?? 'Page',
          headerRight: () =>
            hasAlerts && (m?.following || isMember) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notification settings"
                hitSlop={10}
                onPress={() => setSheet('alerts')}
                style={{ paddingHorizontal: space.md }}
              >
                <AppText variant="heading">🔔</AppText>
              </Pressable>
            ) : null,
        }}
      />
      <Animated.FlatList<Item>
        data={items}
        keyExtractor={(i) => i.key}
        itemLayoutAnimation={layout}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <Animated.View entering={enter.rise(staggerDelay(index % 20))} exiting={exit.fade()} style={{ paddingHorizontal: space.md }}>
            {item.post ? <PostCard post={item.post} /> : item.announcement ? <AnnouncementCard item={item.announcement} onPage={slug} /> : null}
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={<View style={{ paddingHorizontal: space.md }}>{empty}</View>}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        onEndReached={() => tab === 'posts' && feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={page.isRefetching || feed.isRefetching}
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: ['page', slug] });
              feed.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ margin: space.lg }} /> : null}
      />
      <ActionSheet visible={sheet === 'manage'} title="Manage Page" actions={manageActions} onClose={() => setSheet(null)} />
      <ActionSheet visible={sheet === 'membership'} actions={membershipActions} onClose={() => setSheet(null)} />
      <AlertsSheet
        slug={slug}
        visible={sheet === 'alerts'}
        hasAnnouncements={hasFeature('announcements')}
        hasLive={hasFeature('live')}
        onClose={() => setSheet(null)}
      />
      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

function AlertsSheet({
  slug,
  visible,
  hasAnnouncements,
  hasLive,
  onClose,
}: {
  slug: string;
  visible: boolean;
  hasAnnouncements: boolean;
  hasLive: boolean;
  onClose: () => void;
}) {
  const prefs = useNotificationPrefs(slug);
  const set = useSetNotificationPrefs(slug);
  const on = prefs.data ?? { announcements: true, live_alerts: true };
  const fail = (err: unknown) => Alert.alert("Couldn't update", errorMessage(err));
  return (
    <ActionSheet
      visible={visible}
      title="Notifications from this Page"
      onClose={onClose}
      actions={[
        ...(hasAnnouncements
          ? [
              {
                label: on.announcements ? 'Turn off announcements' : 'Turn on announcements',
                hint: on.announcements ? 'You hear about announcements sent to you' : 'Announcements are off',
                onPress: () => set.mutate({ announcements: !on.announcements }, { onError: fail }),
              },
            ]
          : []),
        ...(hasLive
          ? [
              {
                label: on.live_alerts ? 'Turn off live alerts' : 'Turn on live alerts',
                hint: on.live_alerts ? 'You hear when this Page goes live' : 'Live alerts are off',
                onPress: () => set.mutate({ live_alerts: !on.live_alerts }, { onError: fail }),
              },
            ]
          : []),
      ]}
    />
  );
}

function About({ page }: { page: NonNullable<ReturnType<typeof usePage>['data']> }) {
  const rows = [
    { label: 'Denomination', value: page.denomination },
    { label: 'Location', value: page.location },
    { label: 'Address', value: page.address },
    { label: 'Phone', value: page.phone },
  ].filter((r) => r.value);
  return (
    <Card style={{ gap: space.md }}>
      {page.description ? <AppText>{page.description}</AppText> : <AppText color={colors.textMuted}>No description yet.</AppText>}
      {rows.map((r) => (
        <View key={r.label}>
          <AppText variant="caption" color={colors.textMuted}>
            {r.label}
          </AppText>
          <AppText>{r.value}</AppText>
        </View>
      ))}
      {page.website ? (
        <View>
          <AppText variant="caption" color={colors.textMuted}>
            Website
          </AppText>
          <AppText color={colors.link} onPress={() => Linking.openURL(page.website)}>
            {page.website}
          </AppText>
        </View>
      ) : null}
      {page.has_members ? (
        <AppText variant="caption" color={colors.textMuted}>
          {page.join_policy === 'open' ? 'Anyone can join' : 'New members are approved by the Page'}
        </AppText>
      ) : null}
    </Card>
  );
}

function EmptyCard({ title, body }: { title: string; body?: string }) {
  return (
    <Card style={{ alignItems: 'center', gap: space.sm }}>
      <AppText variant="heading">{title}</AppText>
      {body ? (
        <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
          {body}
        </AppText>
      ) : null}
    </Card>
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
  logoWrap: { marginTop: -LOGO / 2, alignSelf: 'flex-start' },
  logoRing: { borderRadius: LOGO * 0.32, borderWidth: 4, borderColor: colors.card, backgroundColor: colors.card },
  logoLoading: { borderRadius: LOGO * 0.28, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stats: { flexDirection: 'row', gap: space.lg },
  actions: { flexDirection: 'row', gap: space.sm },
  tabsWrap: { paddingHorizontal: space.md, paddingTop: space.lg, paddingBottom: space.md, gap: space.md },
});
