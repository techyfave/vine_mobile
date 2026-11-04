import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { can, type Member, useMembers, useModerateMember, usePageMe, useRemoveMember } from '@/features/pages/api';
import { Tabs } from '@/features/pages/components';
import { routes } from '@/lib/routes';
import { AppText, Avatar, Button, Skeleton } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

type Status = 'approved' | 'pending' | 'banned';

/**
 * Who belongs to a Page. Members see the member list; managers also see join requests and bans and can act.
 * (Belonging to a church is personal, so outsiders can't see this list at all.)
 */
export default function Members() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const me = usePageMe(slug);
  const manager = can(me.data, 'page.members.manage');
  const [status, setStatus] = useState<Status>('approved');
  const list = useMembers(slug, manager ? status : 'approved', !me.isLoading);
  const moderate = useModerateMember(slug);
  const remove = useRemoveMember(slug);
  const fail = (err: unknown) => Alert.alert("Couldn't update", errorMessage(err));

  const actions = (m: Member) => {
    if (!manager || m.role === 'admin') return null; // admins are managed from roles, not here
    if (m.status === 'pending')
      return (
        <View style={styles.buttons}>
          <Button title="Approve" size="sm" onPress={() => moderate.mutate({ userId: m.user_id, status: 'approved' }, { onError: fail })} />
          <Button title="Decline" size="sm" variant="outline" onPress={() => remove.mutate(m.user_id, { onError: fail })} />
        </View>
      );
    if (m.status === 'banned')
      return <Button title="Lift ban" size="sm" variant="outline" onPress={() => moderate.mutate({ userId: m.user_id, status: 'approved' }, { onError: fail })} />;
    return (
      <Button
        title="•••"
        size="sm"
        variant="ghost"
        onPress={() =>
          Alert.alert(m.name, undefined, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove from Page', onPress: () => remove.mutate(m.user_id, { onError: fail }) },
            {
              text: 'Ban',
              style: 'destructive',
              onPress: () =>
                Alert.alert(`Ban ${m.name}?`, 'They are removed and can’t join again until the ban is lifted.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Ban', style: 'destructive', onPress: () => moderate.mutate({ userId: m.user_id, status: 'banned' }, { onError: fail }) },
                ]),
            },
          ])
        }
      />
    );
  };

  return (
    <View style={{ flex: 1, padding: space.md, gap: space.md }}>
      <Stack.Screen options={{ title: 'Members' }} />
      {manager ? (
        <Tabs
          tabs={[
            { key: 'approved' as Status, label: 'Members' },
            { key: 'pending' as Status, label: 'Requests' },
            { key: 'banned' as Status, label: 'Banned' },
          ]}
          value={status}
          onChange={setStatus}
        />
      ) : null}
      {list.isError ? (
        <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
          {errorMessage(list.error)}
        </AppText>
      ) : (
        <FlatList
          data={list.data ?? []}
          keyExtractor={(m) => m.user_id}
          contentContainerStyle={{ gap: space.sm, paddingBottom: space.xxl }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Pressable style={styles.person} onPress={() => router.push(routes.profile(item.username))} accessibilityRole="link">
                <Avatar uri={item.profile_picture} size={40} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" numberOfLines={1}>
                    {item.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                    @{item.username}
                    {item.role !== 'member' ? ` · ${item.role === 'admin' ? 'Admin' : 'Moderator'}` : ''}
                  </AppText>
                </View>
              </Pressable>
              {actions(item)}
            </View>
          )}
          ListEmptyComponent={
            list.isLoading ? (
              <View style={{ gap: space.sm }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={64} round={radius.lg} />
                ))}
              </View>
            ) : (
              <AppText color={colors.textMuted} style={{ textAlign: 'center', marginTop: space.xl }}>
                {status === 'pending' ? 'No requests waiting.' : status === 'banned' ? 'No one is banned.' : 'No members yet.'}
              </AppText>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  buttons: { flexDirection: 'row', gap: space.xs },
});
