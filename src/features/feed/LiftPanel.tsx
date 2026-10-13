import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { errorMessage } from '@/api/errors';
import { routes } from '@/lib/routes';
import { timeAgo } from '@/lib/time';
import { AppText, Pop, PressableScale } from '@/ui/components';
import { enter, layout } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

import { type LiftKind, type Post, useDeleteLiftUpdate, useLiftRespond } from './api';

/**
 * The Lift part of a post: who's standing with the person, the author's updates, and the
 * "I'll pray" / "I'm with you" answers. "I'm with you" is there for everyone, including people
 * who don't pray; "I'll pray" is hidden when the author asked for support only.
 */
export function LiftPanel({ post, mine, inDetail }: { post: Post; mine: boolean; inDetail: boolean }) {
  const lift = post.lift!;
  const respond = useLiftRespond();
  const removeUpdate = useDeleteLiftUpdate();
  const supportOnly = lift.mode === 'support_only';
  const total = lift.pray_count + lift.with_you_count;
  const updates = inDetail ? lift.updates : lift.updates.slice(-1);

  const answer = (kind: LiftKind) =>
    respond.mutate(
      { post, kind: lift.my_response === kind ? null : kind },
      { onError: (e) => Alert.alert("Couldn't do that", errorMessage(e)) },
    );

  const confirmRemove = (updateId: string) =>
    Alert.alert('Remove this update?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeUpdate.mutate({ postId: post.id, updateId }) },
    ]);

  return (
    <Animated.View layout={layout} style={[styles.panel, lift.answered && styles.panelAnswered]}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <AppText variant="caption" color={colors.white}>
            {lift.answered ? '🙌 Answered' : supportOnly ? '🤝 Lift · support' : '🙏 Lift'}
          </AppText>
        </View>
        {total > 0 ? (
          <Pressable onPress={() => router.push(routes.liftPeople(post.id))} hitSlop={8} accessibilityRole="link">
            <AppText variant="caption" color={colors.lift}>
              {summary(lift.pray_count, lift.with_you_count, mine)}
            </AppText>
          </Pressable>
        ) : (
          <AppText variant="caption" color={colors.textMuted}>
            {mine ? 'People will see this and stand with you' : 'Be the first to stand with them'}
          </AppText>
        )}
      </View>

      {updates.map((u) => (
        <Animated.View key={u.id} entering={enter.rise()} style={[styles.update, u.is_testimony && styles.testimony]}>
          <View style={styles.updateHead}>
            <AppText variant="caption" color={u.is_testimony ? colors.lift : colors.secondary}>
              {u.is_testimony ? 'Testimony' : 'Update'} · {timeAgo(u.created_at)}
            </AppText>
            {mine && inDetail ? (
              <AppText variant="caption" color={colors.textMuted} onPress={() => confirmRemove(u.id)}>
                Remove
              </AppText>
            ) : null}
          </View>
          <AppText numberOfLines={inDetail ? undefined : 4}>{u.body}</AppText>
        </Animated.View>
      ))}
      {!inDetail && lift.updates.length > 1 ? (
        <AppText
          variant="caption"
          color={colors.link}
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
        >
          See all {lift.updates.length} updates
        </AppText>
      ) : null}

      <View style={styles.buttons}>
        {mine ? (
          <>
            <LiftButton label="Post an update" onPress={() => router.push(routes.liftUpdate(post.id))} />
            {!lift.answered ? <LiftButton label="Share testimony" onPress={() => router.push(routes.liftUpdate(post.id, true))} /> : null}
          </>
        ) : (
          <>
            {!supportOnly ? (
              <LiftButton emoji="🙏" label={lift.my_response === 'pray' ? 'Praying' : "I'll pray"} active={lift.my_response === 'pray'} onPress={() => answer('pray')} />
            ) : null}
            <LiftButton
              emoji="🤝"
              label={lift.my_response === 'with_you' ? 'With you' : "I'm with you"}
              active={lift.my_response === 'with_you'}
              onPress={() => answer('with_you')}
            />
          </>
        )}
      </View>
    </Animated.View>
  );
}

function summary(pray: number, withYou: number, mine: boolean): string {
  const parts = [];
  if (pray) parts.push(`${pray} praying`);
  if (withYou) parts.push(`${withYou} with ${mine ? 'you' : 'them'}`);
  return parts.join(' · ');
}

function LiftButton({ emoji, label, active = false, onPress }: { emoji?: string; label: string; active?: boolean; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      scaleTo={0.95}
      style={[styles.button, active && styles.buttonOn]}
    >
      {emoji ? (
        <Pop active={active}>
          <AppText variant="bodyBold">{emoji}</AppText>
        </Pop>
      ) : null}
      <AppText variant="caption" color={active ? colors.white : colors.lift}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.liftSoft,
    borderColor: colors.liftBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.md,
  },
  panelAnswered: { borderColor: colors.lift },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, flexWrap: 'wrap' },
  badge: { backgroundColor: colors.lift, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 3 },
  update: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, gap: 4 },
  testimony: { borderLeftWidth: 3, borderLeftColor: colors.lift },
  updateHead: { flexDirection: 'row', justifyContent: 'space-between' },
  buttons: { flexDirection: 'row', gap: space.sm },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.lift,
    backgroundColor: colors.card,
  },
  buttonOn: { backgroundColor: colors.lift },
});
