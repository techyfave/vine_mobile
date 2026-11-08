import { router, Stack } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';

import { useMyPages } from '@/features/pages/api';
import { Chip, PageRow } from '@/features/pages/components';
import { routes } from '@/lib/routes';
import { AppText, Button, Card, Skeleton } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

/** Your Pages: the ones you help run, belong to (or asked to join), and follow. */
export default function MyPagesScreen() {
  const mine = useMyPages();
  const d = mine.data;
  const managingSlugs = new Set(d?.managing.map((p) => p.slug));
  const memberships = (d?.memberships ?? []).filter((m) => !managingSlugs.has(m.page.slug));

  return (
    <ScrollView
      contentContainerStyle={{ padding: space.md, gap: space.md, paddingBottom: space.xxxl }}
      refreshControl={<RefreshControl refreshing={mine.isRefetching} onRefresh={() => mine.refetch()} tintColor={colors.primary} />}
    >
      <Stack.Screen options={{ title: 'Pages' }} />
      <Button title="Create a Page" onPress={() => router.push(routes.newPage)} />
      <Button title="Find a Page" variant="outline" onPress={() => router.push({ pathname: '/search', params: { tab: 'pages' } })} />

      {mine.isLoading ? (
        <View style={{ gap: space.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={68} round={radius.lg} />
          ))}
        </View>
      ) : null}

      {d?.managing.length ? (
        <Section title="Pages you run">
          {d.managing.map((p) => (
            <PageRow key={p.id} page={p} />
          ))}
        </Section>
      ) : null}

      {memberships.length ? (
        <Section title="Member of">
          {memberships.map((m) => (
            <PageRow
              key={m.page.id}
              page={m.page}
              right={m.status === 'pending' ? <Chip label="Requested" /> : m.is_home ? <Chip label="Home" tone="primary" /> : undefined}
            />
          ))}
        </Section>
      ) : null}

      {d?.following.length ? (
        <Section title="Following">
          {d.following.map((p) => (
            <PageRow key={p.id} page={p} />
          ))}
        </Section>
      ) : null}

      {d && !d.managing.length && !memberships.length && !d.following.length ? (
        <Card style={{ alignItems: 'center', gap: space.sm }}>
          <AppText variant="heading">No Pages yet</AppText>
          <AppText color={colors.textMuted} style={{ textAlign: 'center' }}>
            Find Pages to follow, or create one of your own.
          </AppText>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <AppText variant="heading">{title}</AppText>
      {children}
    </View>
  );
}
