import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';
import { usePageSearch } from '@/features/pages/api';
import { PageRow, Tabs } from '@/features/pages/components';
import { PersonRow } from '@/features/people/PersonRow';
import { AppText, Input } from '@/ui/components';
import { enter, staggerDelay } from '@/ui/motion';
import { colors, space } from '@/ui/theme';

type Kind = 'people' | 'pages';

/** Find people or Pages by name. */
export default function Search() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [kind, setKind] = useState<Kind>(params.tab === 'pages' ? 'pages' : 'people');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const results = useQuery({
    queryKey: ['search', debounced],
    enabled: kind === 'people' && debounced.length >= 2,
    queryFn: async () => unwrap(await api.GET('/api/v1/users/search/', { params: { query: { q: debounced } } })),
  });
  const pages = usePageSearch(kind === 'pages' ? debounced : '');

  return (
    <View style={{ flex: 1, padding: space.md, gap: space.md }}>
      <Input
        placeholder={kind === 'pages' ? 'Search Pages' : 'Search people'}
        value={q}
        onChangeText={setQ}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      <Tabs
        tabs={[
          { key: 'people' as Kind, label: 'People' },
          { key: 'pages' as Kind, label: 'Pages' },
        ]}
        value={kind}
        onChange={setKind}
      />
      {kind === 'pages' ? (
        <FlatList
          data={pages.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ gap: space.sm }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <Animated.View entering={enter.rise(staggerDelay(index))}>
              <PageRow page={item} />
            </Animated.View>
          )}
          ListEmptyComponent={
            debounced.length >= 2 && !pages.isLoading ? (
              <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
                No Pages found for “{debounced}”.
              </AppText>
            ) : null
          }
        />
      ) : (
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
      )}
    </View>
  );
}
