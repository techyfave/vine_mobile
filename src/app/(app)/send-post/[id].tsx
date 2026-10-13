import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api } from '@/api/client';
import { errorMessage, unwrap } from '@/api/errors';
import { useKeyboardHeight } from '@/lib/keyboard';
import { displayName } from '@/lib/time';
import { AppText, Avatar, Button, ErrorText, Input, Pop } from '@/ui/components';
import { enter, staggerDelay } from '@/ui/motion';
import { colors, radius, space } from '@/ui/theme';

const MAX = 10;

/** Send a post to people you follow or who follow you. They get a notification that opens it. */
export default function SendPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const keyboard = useKeyboardHeight();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const people = useQuery({
    queryKey: ['connections', debounced],
    queryFn: async () => unwrap(await api.GET('/api/v1/users/me/connections/', { params: { query: { q: debounced } } })),
  });

  const send = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST('/api/v1/feed/posts/{post_id}/send/', {
          params: { path: { post_id: id } },
          body: { usernames: picked, note: note.trim() },
        }),
      ) as unknown as { sent_to: string[] },
    onSuccess: (res) => {
      const n = res.sent_to.length;
      Alert.alert('Sent', n === 1 ? `Sent to @${res.sent_to[0]}.` : `Sent to ${n} people.`);
      router.back();
    },
  });

  const toggle = (username: string) =>
    setPicked((cur) => (cur.includes(username) ? cur.filter((u) => u !== username) : cur.length >= MAX ? cur : [...cur, username]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ padding: space.md, gap: space.sm }}>
        <Input placeholder="Search people you follow or who follow you" value={q} onChangeText={setQ} autoCapitalize="none" autoCorrect={false} />
      </View>
      <FlatList
        data={people.data ?? []}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: space.md, gap: space.sm, paddingBottom: space.md }}
        renderItem={({ item, index }) => {
          const on = picked.includes(item.username);
          return (
            <Animated.View entering={enter.rise(staggerDelay(index))}>
              <Pressable
                onPress={() => toggle(item.username)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[styles.row, on && styles.rowOn]}
              >
                <Avatar uri={item.profile_picture} size={40} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" numberOfLines={1}>
                    {displayName(item)}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    @{item.username}
                  </AppText>
                </View>
                <Pop active={on}>
                  <View style={[styles.check, on && styles.checkOn]}>
                    {on ? (
                      <AppText variant="caption" color={colors.white}>
                        ✓
                      </AppText>
                    ) : null}
                  </View>
                </Pop>
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          people.isLoading ? null : (
            <AppText color={colors.textMuted} style={{ textAlign: 'center', marginTop: space.lg }}>
              {debounced ? `No one matching “${debounced}”.` : 'Follow people to send them posts.'}
            </AppText>
          )
        }
      />
      <View style={[styles.footer, { paddingBottom: keyboard ? keyboard + space.sm : space.lg }]}>
        <Input placeholder="Add a message (optional)" value={note} onChangeText={setNote} maxLength={500} />
        {send.error ? <ErrorText>{errorMessage(send.error)}</ErrorText> : null}
        <Button
          title={picked.length ? `Send to ${picked.length === 1 ? `@${picked[0]}` : `${picked.length} people`}` : 'Pick someone'}
          disabled={!picked.length}
          loading={send.isPending}
          onPress={() => send.mutate()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.cardMuted },
  rowOn: { backgroundColor: colors.backgroundLight },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  footer: { padding: space.md, gap: space.sm, borderTopWidth: 1, borderTopColor: colors.cardMuted, backgroundColor: colors.white },
});
