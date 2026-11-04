import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { type AudienceInput, can, useCreateAnnouncement, useOrganization, usePage, usePageMe } from '@/features/pages/api';
import { useKeyboardHeight } from '@/lib/keyboard';
import { AppText, Button, Card, ErrorText, Input } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

type Kind = AudienceInput['kind'];
type Role = NonNullable<AudienceInput['role']>;

/** Roles people can address in an announcement (church Pages have these; the server checks the rest). */
const ROLES: { slug: Role; label: string }[] = [
  { slug: 'volunteer', label: 'Volunteers' },
  { slug: 'care_team', label: 'Care team' },
  { slug: 'page_admin', label: 'Admins' },
];

/** Write an announcement and choose exactly who receives it. The server enforces who may send where. */
export default function Announce() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = usePage(slug);
  const me = usePageMe(slug);
  const org = useOrganization(slug);
  const create = useCreateAnnouncement(slug);
  const keyboard = useKeyboardHeight();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [kind, setKind] = useState<Kind>('own_page');
  const [chosen, setChosen] = useState<string[]>([]);
  const [rolePage, setRolePage] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('volunteer');
  const [error, setError] = useState<string>();

  const p = page.data;
  const isHq = Boolean(org.data?.is_hq);
  const speaksForOrg = isHq && can(me.data, 'announce.org');
  const branches = org.data?.branches ?? [];

  const kinds: { key: Kind; label: string; hint: string }[] = [
    { key: 'own_page', label: `Members of ${p?.name ?? 'this Page'}`, hint: 'Everyone who belongs to this Page' },
    { key: 'role', label: 'A role', hint: 'Only people with a role, e.g. volunteers' },
    ...(speaksForOrg
      ? [
          { key: 'organization' as Kind, label: 'Whole organization', hint: 'This Page and every branch' },
          { key: 'all_branches' as Kind, label: 'All branches', hint: 'Every branch, not HQ-only members' },
          { key: 'branches' as Kind, label: 'Choose branches', hint: 'Only the branches you pick' },
        ]
      : []),
  ];

  const audience = (): AudienceInput => {
    if (kind === 'branches') return { kind, page_ids: chosen, page_id: null, role: null };
    if (kind === 'role') return { kind, page_ids: [], page_id: rolePage ?? p?.id ?? null, role };
    return { kind, page_ids: [], page_id: null, role: null };
  };

  const ready = title.trim().length > 0 && body.trim().length > 0 && (kind !== 'branches' || chosen.length > 0);

  function send() {
    setError(undefined);
    create.mutate(
      { title: title.trim(), body: body.trim(), is_pinned: pinned, audience: audience() },
      { onSuccess: () => router.back(), onError: (err) => setError(errorMessage(err)) },
    );
  }

  const toggleBranch = (id: string) => setChosen((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));

  return (
    <ScrollView
      contentContainerStyle={{ padding: space.md, gap: space.md, paddingBottom: keyboard + space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Announcement' }} />
      <Card style={{ gap: space.md }}>
        <Input placeholder="Title" value={title} onChangeText={setTitle} maxLength={255} />
        <Input
          placeholder="What do people need to know?"
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={10000}
          style={{ minHeight: 140, textAlignVertical: 'top' }}
        />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold">Pin to the top</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Stays first in the Page&apos;s announcements
            </AppText>
          </View>
          <Switch value={pinned} onValueChange={setPinned} trackColor={{ true: colors.link }} />
        </View>
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="heading">Who is it for?</AppText>
        {kinds.map((k) => (
          <Choice key={k.key} label={k.label} hint={k.hint} selected={kind === k.key} onPress={() => setKind(k.key)} />
        ))}

        {kind === 'branches' ? (
          <View style={styles.chips}>
            {[...(org.data ? [org.data.hq] : []), ...branches].map((b) => (
              <ChipToggle key={b.id} label={b.name} on={chosen.includes(b.id)} onPress={() => toggleBranch(b.id)} />
            ))}
          </View>
        ) : null}

        {kind === 'role' ? (
          <View style={{ gap: space.sm }}>
            {speaksForOrg && branches.length ? (
              <>
                <AppText variant="caption" color={colors.textMuted}>
                  At
                </AppText>
                <View style={styles.chips}>
                  <ChipToggle label={p?.name ?? 'This Page'} on={!rolePage} onPress={() => setRolePage(null)} />
                  {branches.map((b) => (
                    <ChipToggle key={b.id} label={b.name} on={rolePage === b.id} onPress={() => setRolePage(b.id)} />
                  ))}
                </View>
              </>
            ) : null}
            <AppText variant="caption" color={colors.textMuted}>
              Role
            </AppText>
            <View style={styles.chips}>
              {ROLES.map((r) => (
                <ChipToggle key={r.slug} label={r.label} on={role === r.slug} onPress={() => setRole(r.slug)} />
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      <ErrorText>{error}</ErrorText>
      <Button title="Send announcement" onPress={send} loading={create.isPending} disabled={!ready} />
      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Only the people you chose can see it, and they&apos;re notified.
      </AppText>
    </ScrollView>
  );
}

function Choice({ label, hint, selected, onPress }: { label: string; hint: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceOn]}
    >
      <View style={[styles.radio, selected && styles.radioOn]} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold">{label}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {hint}
        </AppText>
      </View>
    </Pressable>
  );
}

function ChipToggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
    >
      <AppText variant="caption" color={on ? colors.white : colors.primary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  choiceOn: { borderColor: colors.primary, backgroundColor: colors.subtle },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, paddingVertical: 6, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
