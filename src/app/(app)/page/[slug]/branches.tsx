import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import {
  type BranchLink,
  can,
  useBranchLinkAction,
  useBranchLinks,
  useInviteBranch,
  useOrganization,
  usePage,
  usePageMe,
  usePageSearch,
  useRequestToJoinHq,
} from '@/features/pages/api';
import { Chip, PageRow } from '@/features/pages/components';
import { useKeyboardHeight } from '@/lib/keyboard';
import { AppText, Button, Card, Input } from '@/ui/components';
import { colors, space } from '@/ui/theme';

/**
 * Branches and organization for one Page.
 * - An HQ (or a Page that could become one) invites existing Pages as branches.
 * - A standalone Page's owner can ask to join an HQ.
 * - Each side sees what's waiting for it, and either side can unlink.
 * Nobody attaches a Page to an organization on their own: the other side always decides.
 */
export default function Branches() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = usePage(slug);
  const me = usePageMe(slug);
  const org = useOrganization(slug);
  const isOwner = Boolean(me.data?.roles.includes('owner'));
  const managesBranches = can(me.data, 'org.branches.manage');
  const pending = useBranchLinks(slug, 'pending', managesBranches || isOwner);
  const accepted = useBranchLinks(slug, 'accepted', managesBranches || isOwner);
  const act = useBranchLinkAction(slug);
  const keyboard = useKeyboardHeight();

  const p = page.data;
  const isBranch = Boolean(p?.hq);
  const isHq = Boolean(org.data?.is_hq);
  const canInvite = managesBranches && !isBranch;
  const canAskToJoin = isOwner && !isBranch && !isHq;
  const fail = (title: string) => (err: unknown) => Alert.alert(title, errorMessage(err));

  const run = (link: BranchLink, action: 'accept' | 'decline' | 'cancel' | 'unlink') =>
    act.mutate({ link, action }, { onError: fail("Couldn't update") });

  const confirmUnlink = (link: BranchLink) =>
    Alert.alert(
      `Unlink ${link.branch.name}?`,
      `${link.branch.name} keeps its members, roles and posts and becomes a standalone Page.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unlink', style: 'destructive', onPress: () => run(link, 'unlink') },
      ],
    );

  // A link waits on us when we're the side that didn't start it.
  const waitingOnUs = (l: BranchLink) =>
    (l.hq.slug === slug && l.direction === 'request') || (l.branch.slug === slug && l.direction === 'invite');
  const incoming = (pending.data ?? []).filter(waitingOnUs);
  const outgoing = (pending.data ?? []).filter((l) => !waitingOnUs(l));

  if (!p || me.isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: space.xl }} />;

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md, paddingBottom: keyboard + space.xl }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Branches' }} />

      {org.data ? (
        <Card style={{ gap: space.sm }}>
          <AppText variant="heading">{isHq ? 'Your branches' : 'Your organization'}</AppText>
          <PageRow page={org.data.hq} right={<Chip label="HQ" tone="primary" />} />
          {org.data.branches.map((b) => {
            const link = (accepted.data ?? []).find((l) => l.branch.slug === b.slug);
            return (
              <PageRow
                key={b.id}
                page={b}
                right={link && (managesBranches || (isOwner && b.slug === slug)) ? (
                  <Button title="Unlink" variant="ghost" size="sm" onPress={() => confirmUnlink(link)} />
                ) : undefined}
              />
            );
          })}
        </Card>
      ) : (
        <Card style={{ gap: space.xs }}>
          <AppText variant="heading">Single location</AppText>
          <AppText color={colors.textMuted}>
            {p.name} isn&apos;t part of an organization. Churches with several campuses link them here: the HQ invites
            each campus, or a campus asks to join its HQ.
          </AppText>
        </Card>
      )}

      {incoming.length ? (
        <Card style={{ gap: space.sm }}>
          <AppText variant="heading">Waiting for you</AppText>
          {incoming.map((l) => {
            const other = l.hq.slug === slug ? l.branch : l.hq;
            return (
              <View key={l.id} style={{ gap: space.sm }}>
                <PageRow
                  page={other}
                  subtitle={l.direction === 'invite' ? 'Invited you to join as a branch' : 'Asked to join as a branch'}
                />
                {other.is_verified ? null : (
                  <AppText variant="caption" color={colors.textMuted}>
                    This Page isn&apos;t verified. Make sure it&apos;s really who it says it is.
                  </AppText>
                )}
                <View style={styles.buttons}>
                  <Button title="Accept" size="sm" style={{ flex: 1 }} onPress={() => run(l, 'accept')} loading={act.isPending} />
                  <Button title="Decline" size="sm" variant="outline" style={{ flex: 1 }} onPress={() => run(l, 'decline')} />
                </View>
              </View>
            );
          })}
        </Card>
      ) : null}

      {outgoing.length ? (
        <Card style={{ gap: space.sm }}>
          <AppText variant="heading">Sent</AppText>
          {outgoing.map((l) => {
            const other = l.hq.slug === slug ? l.branch : l.hq;
            return (
              <PageRow
                key={l.id}
                page={other}
                subtitle="Waiting for them to decide"
                right={<Button title="Cancel" variant="ghost" size="sm" onPress={() => run(l, 'cancel')} />}
              />
            );
          })}
        </Card>
      ) : null}

      {canInvite ? <FindPage mode="invite" slug={slug} pageType={p.page_type} /> : null}
      {canAskToJoin ? <FindPage mode="join" slug={slug} pageType={p.page_type} /> : null}
    </ScrollView>
  );
}

/** Search Pages, then invite one as a branch (HQ) or ask to join one (standalone Page owner). */
function FindPage({ mode, slug, pageType }: { mode: 'invite' | 'join'; slug: string; pageType: string }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const results = usePageSearch(debounced);
  const invite = useInviteBranch(slug);
  const ask = useRequestToJoinHq(slug);
  const [sent, setSent] = useState<string[]>([]);

  const send = (target: string) => {
    const mutation = mode === 'invite' ? invite : ask;
    mutation.mutate(target, {
      onSuccess: () => setSent((s) => [...s, target]),
      onError: (err) => Alert.alert("Couldn't send", errorMessage(err)),
    });
  };

  return (
    <Card style={{ gap: space.sm }}>
      <AppText variant="heading">{mode === 'invite' ? 'Invite a branch' : 'Join an organization'}</AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {mode === 'invite'
          ? "Find the campus's Page. Its owner accepts before it becomes your branch."
          : "Find your HQ's Page. Its leadership approves before you become a branch."}
      </AppText>
      <Input placeholder="Search Pages" value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="search" />
      {(results.data ?? [])
        .filter((r) => r.slug !== slug && r.page_type === pageType) // only Pages of the same type can link
        .map((r) => (
          <PageRow
            key={r.id}
            page={r}
            right={
              sent.includes(r.slug) ? (
                <Chip label="Sent" />
              ) : (
                <Button title={mode === 'invite' ? 'Invite' : 'Ask'} size="sm" onPress={() => send(r.slug)} />
              )
            }
          />
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: space.sm },
});
