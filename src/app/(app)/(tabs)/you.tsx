import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { routes } from '@/lib/routes';
import { displayName } from '@/lib/time';
import { icons } from '@/ui/assets';
import { AppText, Avatar, Button, Card, Icon, PressableScale } from '@/ui/components';
import { TAB_BAR_SPACE } from '@/ui/TabBar';
import { colors, radius, space } from '@/ui/theme';
import { ScreenTitle } from '@/ui/TopBar';

/** You tab: your profile, your stuff, settings. */
export default function You() {
  const { user, signOut } = useAuth();
  const soon = (what: string) => Alert.alert(what, 'This is coming in a later update.');
  const items = [
    { icon: icons.pagesNav, label: 'Pages', onPress: () => router.push(routes.pages) },
    { icon: icons.likedNav, label: 'Saved', onPress: () => router.push('/saved') },
    {
      icon: icons.friendsNav,
      label: 'Followers & following',
      onPress: () => (user ? router.push(routes.people(user.username, 'followers')) : undefined),
    },
    { icon: icons.groupsNav, label: 'Groups', onPress: () => soon('Groups') },
  ];
  const footer = [
    { icon: icons.settingsNav, label: 'Settings & privacy', onPress: () => router.push('/settings') },
    { icon: icons.helpNav, label: 'Help & support', onPress: () => soon('Help & support') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTitle title="You" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.md, gap: space.md, paddingBottom: TAB_BAR_SPACE }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="View your profile"
          onPress={() => user && router.push(routes.profile(user.username))}
          scaleTo={0.98}
          style={styles.profile}
        >
          <Avatar uri={user?.profile_picture} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="heading" color={colors.white} style={{ fontSize: 20, lineHeight: 24 }}>
              {user ? displayName(user) : ''}
            </AppText>
            <AppText variant="caption" color={colors.inkMuted}>
              @{user?.username}
            </AppText>
          </View>
          <View style={styles.viewPill}>
            <AppText variant="label" color={colors.ink} style={{ fontSize: 14 }}>
              View
            </AppText>
          </View>
        </PressableScale>
        <Card style={styles.list}>
          {items.map((i) => (
            <Row key={i.label} {...i} />
          ))}
        </Card>
        <Card style={styles.list}>
          {footer.map((i) => (
            <Row key={i.label} {...i} />
          ))}
        </Card>
        <Button title="Log out" variant="outline" onPress={signOut} />
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, onPress }: { icon: number; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cardMuted }]}
    >
      <Icon source={icon} size={20} tint={colors.ink} />
      <AppText variant="bodyBold" style={{ flex: 1 }}>
        {label}
      </AppText>
      <AppText color={colors.textMuted} accessibilityElementsHidden importantForAccessibility="no">
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: space.lg,
  },
  viewPill: {
    height: 38,
    paddingHorizontal: space.lg,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: 2, padding: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48, paddingHorizontal: space.md, borderRadius: radius.lg },
});
