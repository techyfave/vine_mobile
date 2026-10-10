import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { displayName, timeAgo } from '@/lib/time';
import { icons } from '@/ui/assets';
import { AppText, Avatar, Icon, Pop, PressableScale, Skeleton } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

import { type Post, totalReactions, useToggleLike, useToggleSave } from './api';

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
  const like = useToggleLike();
  const save = useToggleSave();
  const [expanded, setExpanded] = useState(inDetail);
  const [canExpand, setCanExpand] = useState(false);
  const image = post.media.find((m) => m.media_type === 'image' && m.url);
  const open = () => !inDetail && router.push({ pathname: '/post/[id]', params: { id: post.id } });

  function more() {
    const name = `@${post.author.username}`;
    const options = [`Mute ${name}`, `Block ${name}`, 'Cancel'];
    const handle = async (i: number) => {
      const path = { params: { path: { username: post.author.username } } };
      if (i === 0) await api.POST('/api/v1/users/{username}/mute/', path);
      if (i === 1) await api.POST('/api/v1/users/{username}/block/', path);
      if (i === 0 || i === 1) onHide?.(post.id);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2, destructiveButtonIndex: 1 }, handle);
    } else {
      Alert.alert('Post options', undefined, [
        { text: options[0], onPress: () => handle(0) },
        { text: options[1], style: 'destructive', onPress: () => handle(1) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.author}>
          <Avatar uri={post.author.profile_picture} size={46} />
          <View style={{ gap: 2, flexShrink: 1 }}>
            <AppText variant="heading" numberOfLines={1}>
              {displayName(post.author)}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {timeAgo(post.created_at)}
            </AppText>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Post options" hitSlop={10} onPress={more} style={styles.headerBtn}>
            <AppText variant="heading" color={colors.link}>
              •••
            </AppText>
          </Pressable>
          {onHide ? (
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
        <Pressable onPress={open} disabled={inDetail}>
          <Image source={{ uri: image.url }} style={styles.image} contentFit="cover" transition={200} accessibilityLabel="Post image" />
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
