import { router } from 'expo-router';
import { memo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';

import { routes } from '@/lib/routes';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { displayName, timeAgo } from '@/lib/time';
import { icons } from '@/ui/assets';
import { AppText, Avatar, Icon, Pop, PressableScale, Skeleton } from '@/ui/components';
import { ActionSheet, type SheetAction } from '@/ui/ActionSheet';
import { ImageViewer } from '@/ui/ImageViewer';
import { PhotoCarousel } from '@/ui/PhotoCarousel';
import { colors, radius, space } from '@/ui/theme';

import {
  type Audience,
  type Post,
  REPORT_REASONS,
  reportPost,
  totalReactions,
  useDeletePost,
  useMuteOrBlock,
  useSetAudience,
  useToggleLike,
  useToggleRepost,
  useToggleSave,
} from './api';
import { EmbeddedPost } from './EmbeddedPost';
import { LiftPanel } from './LiftPanel';

type Sheet = 'menu' | 'audience' | 'report' | 'share' | null;

const COLLAPSED_LINES = 6;

/**
 * A post in a feed. A plain repost shows the original post with a "reposted" line above it;
 * everything else is a normal card (a quote repost embeds the original inside).
 */
export const PostCard = memo(function PostCard({
  post,
  onHide,
  inDetail = false,
}: {
  post: Post;
  onHide?: (id: string) => void;
  inDetail?: boolean;
}) {
  const isPlainRepost = post.post_type === 'repost' && !post.content.trim();
  if (!isPlainRepost) return <PostCardBody post={post} onHide={onHide} inDetail={inDetail} />;
  return (
    <View style={{ gap: 6 }}>
      <RepostLine post={post} />
      {post.repost_of ? (
        <PostCardBody post={post.repost_of} onHide={onHide ? () => onHide(post.id) : undefined} inDetail={inDetail} />
      ) : (
        <EmbeddedPost post={null} />
      )}
    </View>
  );
});

function RepostLine({ post }: { post: Post }) {
  const { user } = useAuth();
  const mine = user?.id === post.author.id;
  const undo = useToggleRepost();
  return (
    <View style={styles.repostLine}>
      <AppText variant="caption" color={colors.textMuted}>
        🔁{' '}
      </AppText>
      <AppText variant="caption" color={colors.textMuted} style={{ flexShrink: 1 }} numberOfLines={1}>
        {mine ? (
          'You reposted'
        ) : (
          <>
            <AppText variant="caption" color={colors.primary} onPress={() => router.push(routes.profile(post.author.username))}>
              {displayName(post.author)}
            </AppText>{' '}
            reposted
          </>
        )}
      </AppText>
      {mine && post.repost_of ? (
        <AppText variant="caption" color={colors.link} onPress={() => undo.mutate(post.repost_of as Post)} style={{ marginLeft: 'auto' }}>
          Undo
        </AppText>
      ) : null}
    </View>
  );
}

/** Post card from the design: author row, text with "read more", rounded image, action row. */
const PostCardBody = memo(function PostCardBody({
  post,
  onHide,
  inDetail = false,
}: {
  post: Post;
  onHide?: (id: string) => void;
  inDetail?: boolean;
}) {
  const { user } = useAuth();
  const like = useToggleLike();
  const save = useToggleSave();
  const del = useDeletePost();
  const audience = useSetAudience();
  const moderate = useMuteOrBlock();
  const repost = useToggleRepost();
  const [expanded, setExpanded] = useState(inDetail);
  const [canExpand, setCanExpand] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const photos = post.media.filter((m) => m.media_type === 'image' && m.url).map((m) => m.url as string);
  const mine = user?.id === post.author.id;
  const open = () => !inDetail && router.push({ pathname: '/post/[id]', params: { id: post.id } });
  const openProfile = () => router.push(routes.profile(post.author.username));
  const name = `@${post.author.username}`;

  const fail = (err: unknown) => Alert.alert("Couldn't do that", errorMessage(err));

  const menuActions: SheetAction[] = mine
    ? [
        ...(post.lift
          ? [{ label: 'Post a Lift update', hint: 'Everyone standing with you is told', onPress: () => router.push(routes.liftUpdate(post.id)) }]
          : []),
        { label: 'Edit post', onPress: () => router.push(routes.editPost(post.id)) },
        {
          label: 'Change audience',
          hint: post.visibility === 'followers' ? 'Now: Followers' : 'Now: Public',
          onPress: () => setSheet('audience'),
        },
        {
          label: 'Delete post',
          destructive: true,
          onPress: () =>
            Alert.alert('Delete this post?', "It will be removed for everyone. This can't be undone.", [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  del.mutate(post, {
                    onSuccess: () => inDetail && router.back(),
                    onError: fail,
                  }),
              },
            ]),
        },
      ]
    : [
        { label: 'Report post', hint: 'Our team will review it', onPress: () => setSheet('report') },
        {
          label: `Mute ${name}`,
          hint: "You won't see their posts. They won't know.",
          onPress: () =>
            moderate.mutate({ username: post.author.username, action: 'mute' }, { onSuccess: () => onHide?.(post.id), onError: fail }),
        },
        {
          label: `Block ${name}`,
          hint: "Neither of you will see the other's profile or posts.",
          destructive: true,
          onPress: () =>
            moderate.mutate({ username: post.author.username, action: 'block' }, { onSuccess: () => onHide?.(post.id), onError: fail }),
        },
      ];

  const audienceActions: SheetAction[] = (
    [
      { value: 'public', label: 'Public', hint: 'Anyone on Vine' },
      { value: 'followers', label: 'Followers', hint: 'Only people who follow you' },
    ] as { value: Audience; label: string; hint: string }[]
  ).map((o) => ({
    label: post.visibility === o.value ? `${o.label} ✓` : o.label,
    hint: o.hint,
    onPress: () => audience.mutate({ post, visibility: o.value }, { onError: fail }),
  }));

  const canRepost = post.visibility === 'public' || post.visibility === 'group' || post.visibility === 'page';
  const shareOutside = () =>
    Share.share({ message: post.content ? `${post.content.slice(0, 200)}\n\nShared from Vine` : 'Shared from Vine' });
  const shareActions: SheetAction[] = [
    ...(canRepost
      ? [
          post.my_reposted
            ? { label: 'Undo repost', onPress: () => repost.mutate(post, { onError: fail }) }
            : !mine
              ? { label: 'Repost', hint: 'Share it with your followers', onPress: () => repost.mutate(post, { onError: fail }) }
              : null,
          { label: 'Repost with your thoughts', hint: 'Add a few words of your own', onPress: () => router.push(routes.repost(post.id)) },
        ].filter((a): a is SheetAction => a !== null)
      : []),
    { label: 'Share outside Vine', hint: canRepost ? undefined : 'Only public posts can be reposted', onPress: shareOutside },
  ];

  const reportActions: SheetAction[] = REPORT_REASONS.map((r) => ({
    label: r.label,
    onPress: () =>
      reportPost(post, r.value)
        .then((msg) => Alert.alert('Report sent', msg))
        .catch(fail),
  }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable style={styles.author} onPress={openProfile} accessibilityRole="link" accessibilityLabel={`${displayName(post.author)}'s profile`}>
          <Avatar uri={post.author.profile_picture} size={46} />
          <View style={{ gap: 2, flexShrink: 1 }}>
            <AppText variant="heading" numberOfLines={1}>
              {displayName(post.author)}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {timeAgo(post.created_at)} · {post.visibility === 'followers' ? 'Followers' : 'Public'}
            </AppText>
          </View>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Post options" hitSlop={10} onPress={() => setSheet('menu')} style={styles.headerBtn}>
            <AppText variant="heading" color={colors.link}>
              •••
            </AppText>
          </Pressable>
          {onHide && !mine ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Hide post" hitSlop={10} onPress={() => onHide(post.id)} style={styles.headerBtn}>
              <AppText variant="title" color={colors.link} style={{ lineHeight: 24 }}>
                ×
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {post.content ? (
        <Pressable onPress={open} disabled={inDetail}>
          <AppText
            numberOfLines={expanded ? undefined : COLLAPSED_LINES}
            onTextLayout={(e) => !expanded && setCanExpand(e.nativeEvent.lines.length >= COLLAPSED_LINES)}
          >
            {post.content}
          </AppText>
          {!expanded && canExpand ? (
            <AppText variant="bodyBold" color={colors.link} onPress={() => setExpanded(true)}>
              read more
            </AppText>
          ) : null}
        </Pressable>
      ) : null}
      {post.scripture_reference ? (
        <AppText variant="caption" color={colors.secondary}>
          {post.scripture_reference}
        </AppText>
      ) : null}

      {photos.length ? <PhotoCarousel urls={photos} onOpen={setViewing} /> : null}

      {post.post_type === 'repost' ? <EmbeddedPost post={post.repost_of} /> : null}

      {post.lift ? <LiftPanel post={post} mine={mine} inDetail={inDetail} /> : null}

      <View style={styles.actions}>
        <Action
          icon={post.my_reaction ? icons.heart : icons.heartOutline}
          label={`Likes (${totalReactions(post)})`}
          onPress={() => like.mutate(post)}
          active={Boolean(post.my_reaction)}
          pop
        />
        <Action icon={icons.comment} label={`Comments (${post.comment_count})`} onPress={open} />
        <Action
          icon={icons.shared}
          label={post.repost_count ? `Share (${post.repost_count})` : 'Share'}
          onPress={() => setSheet('share')}
          active={post.my_reposted}
          pop
        />
        <Action
          icon={post.is_bookmarked ? icons.saved : icons.savedOutline}
          label={post.is_bookmarked ? 'Saved' : 'Save'}
          onPress={() => save.mutate(post)}
          active={post.is_bookmarked}
          pop
        />
      </View>

      <ActionSheet visible={sheet === 'menu'} actions={menuActions} onClose={() => setSheet(null)} />
      <ActionSheet visible={sheet === 'audience'} title="Who can see this post?" actions={audienceActions} onClose={() => setSheet(null)} />
      <ActionSheet visible={sheet === 'share'} title="Share this post" actions={shareActions} onClose={() => setSheet(null)} />
      <ActionSheet visible={sheet === 'report'} title="Why are you reporting this?" actions={reportActions} onClose={() => setSheet(null)} />
      <ImageViewer images={viewing === null ? null : photos} index={viewing ?? 0} onClose={() => setViewing(null)} />
    </View>
  );
});

function Action({
  icon,
  label,
  onPress,
  active,
  pop = false,
}: {
  icon: number;
  label: string;
  onPress: () => void;
  active?: boolean;
  pop?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={8}
      scaleTo={0.92}
      style={styles.action}
    >
      {pop ? (
        <Pop active={Boolean(active)}>
          <Icon source={icon} size={16} />
        </Pop>
      ) : (
        <Icon source={icon} size={16} />
      )}
      <AppText variant="caption" color={active ? colors.primary : colors.textMuted}>
        {label}
      </AppText>
    </PressableScale>
  );
}

/** Loading placeholder shaped like a post card. */
export function PostCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.author}>
        <Skeleton width={46} height={46} round={23} />
        <View style={{ gap: 6, flex: 1 }}>
          <Skeleton width="45%" height={14} />
          <Skeleton width="25%" height={10} />
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Skeleton height={12} />
        <Skeleton height={12} />
        <Skeleton width="70%" height={12} />
      </View>
      <Skeleton height={160} round={radius.xl} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, paddingHorizontal: space.md, paddingVertical: space.lg, gap: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  repostLine: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md },
  actions: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: space.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
