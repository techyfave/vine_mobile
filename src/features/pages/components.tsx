import { Image } from 'expo-image';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { remoteImage } from '@/lib/media';
import { routes } from '@/lib/routes';
import { timeAgo } from '@/lib/time';
import { AppText, PressableScale } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

import type { Announcement, PageCard } from './api';

/** A Page's logo: rounded square (people are circles, organizations are squares), initials when empty. */
export function PageLogo({ uri, name, size = 44 }: { uri?: string | null; name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: size * 0.28 }]}>
      {uri ? (
        <Image source={remoteImage(uri)} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <AppText variant={size > 60 ? 'title' : 'bodyBold'} color={colors.white}>
          {initials}
        </AppText>
      )}
    </View>
  );
}

export function VerifiedMark({ size = 14 }: { size?: number }) {
  return (
    <View style={[styles.verified, { width: size + 4, height: size + 4, borderRadius: size }]} accessibilityLabel="Verified">
      <AppText variant="caption" color={colors.white} style={{ fontSize: size * 0.75, lineHeight: size }}>
        ✓
      </AppText>
    </View>
  );
}

const TYPE_LABEL: Record<string, string> = {
  church: 'Church',
  ministry: 'Ministry',
  fellowship: 'Fellowship',
  organization: 'Organization',
  creator: 'Creator',
  business: 'Business',
};

export function pageTypeLabel(type: string): string {
  return TYPE_LABEL[type] ?? 'Page';
}

/** A Page in a list: tap to open it. `right` holds an action (Invite, a status chip...). */
export function PageRow({ page, subtitle, right }: { page: PageCard; subtitle?: string; right?: ReactNode }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(routes.page(page.slug))}
      accessibilityRole="link"
      accessibilityLabel={page.name}
    >
      <PageLogo uri={page.logo} name={page.name} size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.nameRow}>
          <AppText variant="bodyBold" numberOfLines={1} style={{ flexShrink: 1 }}>
            {page.name}
          </AppText>
          {page.is_verified ? <VerifiedMark size={12} /> : null}
        </View>
        <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
          {subtitle ?? `${pageTypeLabel(page.page_type)} · ${page.member_count} ${page.member_count === 1 ? 'member' : 'members'}`}
        </AppText>
      </View>
      {right}
    </Pressable>
  );
}

export function Chip({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'primary' | 'warm' }) {
  const t = {
    muted: { bg: colors.cardMuted, fg: colors.primary },
    primary: { bg: colors.primary, fg: colors.white },
    warm: { bg: colors.liftSoft, fg: colors.lift },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
      <AppText variant="caption" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}

/** Pill tabs (Posts / Announcements / About / Branches). Scrolls sideways when they don't fit. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }} // keep its own height inside full-screen columns
      contentContainerStyle={styles.tabs}
      accessibilityRole="tablist"
    >
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <PressableScale
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(t.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <AppText variant="caption" color={active ? colors.white : colors.primary}>
              {t.label}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const COLLAPSED = 6;

/** An announcement: title, text (collapsed when long), who sent it, pinned marker. */
export function AnnouncementCard({ item, onPage }: { item: Announcement; onPage: string }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const fromElsewhere = item.from_page.slug !== onPage;
  return (
    <View style={styles.announcement}>
      <View style={styles.announcementHead}>
        {item.pinned ? <Chip label="Pinned" tone="warm" /> : null}
        <AppText variant="caption" color={colors.textMuted} style={{ flexShrink: 1 }} numberOfLines={1}>
          {fromElsewhere ? (
            <>
              From{' '}
              <AppText variant="caption" color={colors.link} onPress={() => router.push(routes.page(item.from_page.slug))}>
                {item.from_page.name}
              </AppText>{' '}
              ·{' '}
            </>
          ) : null}
          {timeAgo(item.created_at)}
        </AppText>
      </View>
      <AppText variant="heading">{item.title}</AppText>
      <AppText
        numberOfLines={expanded ? undefined : COLLAPSED}
        onTextLayout={(e) => !expanded && setCanExpand(e.nativeEvent.lines.length >= COLLAPSED)}
      >
        {item.body}
      </AppText>
      {!expanded && canExpand ? (
        <AppText variant="bodyBold" color={colors.link} onPress={() => setExpanded(true)}>
          read more
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  verified: { backgroundColor: colors.link, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  chip: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  tabs: { flexDirection: 'row', gap: space.sm },
  tab: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 7, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  announcement: { backgroundColor: colors.card, borderRadius: radius.xl, padding: space.lg, gap: space.sm, borderLeftWidth: 4, borderLeftColor: colors.link },
  announcementHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
