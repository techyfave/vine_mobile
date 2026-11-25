import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { type Href, router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api/client';
import { unwrap } from '@/api/errors';

import { icons, images } from './assets';
import { AppText, Icon, PressableScale, RingButton } from './components';
import { colors, space } from './theme';

/** Home header: logo, then search, messages and notifications. */
export function TopBar() {
  const insets = useSafeAreaInsets();
  const unread = useUnreadCount();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + space.sm }]}>
      <Image
        source={images.vineLogo}
        style={{ width: 40, height: 30 }}
        contentFit="contain"
        tintColor={colors.ink}
        accessibilityLabel="Vine"
      />
      <View style={styles.actions}>
        <RingButton icon={icons.search} label="Search" onPress={() => router.push('/search')} />
        <RingButton icon={icons.chatOutline} label="Messages" onPress={() => router.push('/messages' as Href)} />
        <NotificationsButton unread={unread} />
      </View>
    </View>
  );
}

/** Ink circle; with unread notifications it shows the count in lime. */
function NotificationsButton({ unread }: { unread: number }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} new` : 'Notifications'}
      onPress={() => router.push('/notifications' as Href)}
      scaleTo={0.9}
      style={[styles.bell, !unread && styles.bellQuiet]}
    >
      {unread ? (
        <AppText variant="label" color={colors.accent} style={{ fontSize: 15 }}>
          {unread > 99 ? '99+' : unread}
        </AppText>
      ) : (
        <Icon source={icons.bell} size={20} tint={colors.ink} />
      )}
    </PressableScale>
  );
}

function useUnreadCount() {
  const q = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => unwrap(await api.GET('/api/v1/notifications/unread-count/')).unread,
    refetchInterval: 60_000,
  });
  return q.data ?? 0;
}

/** Big chunky title for top-level tabs ("Watch", "Grapevine", "You"), with optional actions on the right. */
export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.titleWrap, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.titleRow}>
        <AppText variant="display" accessibilityRole="header">
          {title}
        </AppText>
        {right}
      </View>
      {subtitle ? <AppText color={colors.textMuted}>{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.xl,
    paddingRight: space.md,
    paddingBottom: space.sm,
    backgroundColor: colors.background,
  },
  actions: { flexDirection: 'row', gap: 6 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellQuiet: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.outline },
  titleWrap: { paddingHorizontal: space.xl, paddingBottom: space.md, gap: 2, backgroundColor: colors.background },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
});
