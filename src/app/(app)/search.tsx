import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import { PersonRow } from '@/features/people/PersonRow';
import { AppText, Input } from '@/ui/components';
import { enter, staggerDelay } from '@/ui/motion';
import { colors, space } from '@/ui/theme';

/** Find people by name or username; tap someone to open their profile. */
export default function Search() {
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

  return (
    <View style={{ flex: 1, padding: space.md, gap: space.md }}>
      <Input placeholder="Search people" value={q} onChangeText={setQ} autoFocus autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
      <FlatList
        data={results.data ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ gap: space.sm }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <Animated.View entering={enter.rise(staggerDelay(index))}>
            <PersonRow person={item} />
          </Animated.View>
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
