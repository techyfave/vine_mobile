import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Schemas } from '@/api/client';
import { routes } from '@/lib/routes';
import { displayName } from '@/lib/time';
import { AppText, Avatar } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

import { FollowButton } from './follow';

export type Person = Schemas['PersonSchema'];

/** A person in a list: tap to open their profile; Follow / Following on the right. */
export function PersonRow({ person }: { person: Person }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(routes.profile(person.username))}
      accessibilityRole="link"
      accessibilityLabel={`${displayName(person)}'s profile`}
    >
      <Avatar uri={person.profile_picture} size={44} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {displayName(person)}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
          @{person.username}
          {person.followed_by && !person.is_self ? ' · Follows you' : ''}
        </AppText>
      </View>
      {person.is_self ? null : (
        <FollowButton username={person.username} following={person.following ?? false} followedBy={person.followed_by ?? false} size="sm" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md },
});
