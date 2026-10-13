import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';

import { routes } from '@/lib/routes';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { remoteImage } from '@/lib/media';
import { displayName, timeAgo } from '@/lib/time';
import { icons } from '@/ui/assets';
import { AppText, Avatar, Icon, Pop, PressableScale, Skeleton } from '@/ui/components';
import { ActionSheet, type SheetAction } from '@/ui/ActionSheet';
import { ImageViewer } from '@/ui/ImageViewer';
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
  useToggleSave,
} from './api';

type Sheet = 'menu' | 'audience' | 'report' | null;

const COLLAPSED_LINES = 6;

/** Post card from the design: author row, text with "read more", rounded image, action row. */
export const PostCard = memo(function PostCard({
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
  const [expanded, setExpanded] = useState(inDetail);
  const [canExpand, setCanExpand] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const image = post.media.find((m) => m.media_type === 'image' && m.url);
  const mine = user?.id === post.author.id;
  const open = () => !inDetail && router.push({ pathname: '/post/[id]', params: { id: post.id } });
  const openProfile = () => router.push(routes.profile(post.author.username));
  const name = `@${post.author.username}`;

  const fail = (err: unknown) => Alert.alert("Couldn't do that", errorMessage(err));

  const menuActions: SheetAction[] = mine
    ? [
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

      {image?.url ? (
        <Pressable onPress={() => setViewing(image.url ?? null)} accessibilityRole="imagebutton" accessibilityLabel="View photo">
          <Image source={remoteImage(image.url)} style={styles.image} contentFit="cover" transition={200} accessibilityLabel="Post image" />
        </Pressable>
      ) : null}

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
          label="Share"
          onPress={() => Share.share({ message: post.content ? `${post.content.slice(0, 200)}\n\nShared from Vine` : 'Shared from Vine' })}
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
      <ActionSheet visible={sheet === 'report'} title="Why are you reporting this?" actions={reportActions} onClose={() => setSheet(null)} />
      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
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
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.xl, backgroundColor: colors.cardMuted },
  actions: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: space.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
