import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { remoteImage } from '@/lib/media';
import { displayName, timeAgo } from '@/lib/time';
import { AppText, Avatar, PressableScale } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

import type { Post } from './api';

/** The original post inside a quote repost: compact, tap to open it. */
export function EmbeddedPost({ post }: { post: Post | null | undefined }) {
  if (!post) {
    return (
      <View style={[styles.box, styles.gone]}>
        <AppText variant="caption" color={colors.textMuted}>
          This post isn&apos;t available anymore.
        </AppText>
      </View>
    );
  }
  const photos = post.media.filter((m) => m.media_type === 'image' && m.url);
  const first = photos[0]?.url;
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={`Post by ${displayName(post.author)}`}
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      scaleTo={0.98}
      style={styles.box}
    >
      <View style={styles.head}>
        <Avatar uri={post.author.profile_picture} size={24} />
        <AppText variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
          {displayName(post.author)}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          · {timeAgo(post.created_at)}
        </AppText>
        {post.lift ? (
          <View style={styles.liftBadge}>
            <AppText variant="caption" color={colors.white}>
              {post.lift.answered ? '🙌 Answered' : '🙏 Lift'}
            </AppText>
          </View>
        ) : null}
      </View>
      {post.content ? <AppText numberOfLines={4}>{post.content}</AppText> : null}
      {first ? (
        <View>
          <Image source={remoteImage(first)} style={styles.photo} contentFit="cover" transition={200} />
          {photos.length > 1 ? (
            <View style={styles.more}>
              <AppText variant="caption" color={colors.white}>
                +{photos.length - 1}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.md, gap: space.sm, backgroundColor: colors.card },
  gone: { backgroundColor: colors.cardMuted, borderStyle: 'dashed' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liftBadge: { marginLeft: 'auto', backgroundColor: colors.lift, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2 },
  photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.cardMuted },
  more: {
    position: 'absolute',
    right: space.sm,
    bottom: space.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
});
