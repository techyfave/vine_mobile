import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import { displayName } from '@/lib/time';
import { AppText, Avatar, Button, Input } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

export default function Search() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const results = useQuery({
    queryKey: ['search', debounced],
    enabled: debounced.length >= 2,
    queryFn: async () => unwrap(await api.GET('/api/v1/users/search/', { params: { query: { q: debounced } } })),
  });
  const follow = useMutation({
    mutationFn: async (username: string) =>
      unwrap(await api.POST('/api/v1/users/{username}/follow/', { params: { path: { username } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  return (
    <View style={{ flex: 1, padding: space.md, gap: space.md }}>
      <Input placeholder="Search people" value={q} onChangeText={setQ} autoFocus autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
      <FlatList
        data={results.data ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ gap: space.sm }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar uri={item.profile_picture} size={42} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">{displayName(item)}</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                @{item.username}
              </AppText>
            </View>
            <Button title="Follow" size="sm" onPress={() => follow.mutate(item.username)} />
          </View>
        )}
        ListEmptyComponent={
          debounced.length >= 2 && !results.isLoading ? (
            <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
              No one found for “{debounced}”.
            </AppText>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: space.md },
});
