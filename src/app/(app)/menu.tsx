import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { routes } from '@/lib/routes';
import { useAuth } from '@/auth/AuthProvider';
import { displayName } from '@/lib/time';
import { icons } from '@/ui/assets';
import { AppText, Avatar, Button, Card, Icon } from '@/ui/components';
import { colors, radius, space } from '@/ui/theme';

/** Mobile version of the desktop left sidebar. */
export default function Menu() {
  const { user, signOut } = useAuth();
  const soon = (what: string) => Alert.alert(what, 'This is coming in a later update.');
  const items = [
    { icon: icons.friendsNav, label: 'Followers & Following', onPress: () => soon('Followers & Following') },
    { icon: icons.groupsNav, label: 'Groups', onPress: () => soon('Groups') },
    { icon: icons.pagesNav, label: 'Pages', onPress: () => soon('Pages') },
    { icon: icons.likedNav, label: 'Saved', onPress: () => router.push('/saved') },
  ];
  const footer = [
    { icon: icons.settingsNav, label: 'Settings & Privacy', onPress: () => router.push('/settings') },
    { icon: icons.helpNav, label: 'Help & Support', onPress: () => soon('Help & Support') },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => user && router.push(routes.profile(user.username))}
      >
        <Card style={styles.profile}>
          <Avatar uri={user?.profile_picture} size={52} />
          <View style={{ flex: 1 }}>
            <AppText variant="heading">{user ? displayName(user) : ''}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              @{user?.username} · View profile
            </AppText>
          </View>
        </Card>
      </Pressable>
      <Card style={{ gap: space.xs, paddingVertical: space.sm }}>
        {items.map((i) => (
          <Row key={i.label} {...i} />
        ))}
      </Card>
      <Card style={{ gap: space.xs, paddingVertical: space.sm }}>
        {footer.map((i) => (
          <Row key={i.label} {...i} />
        ))}
        <Button title="Log Out" onPress={signOut} style={{ marginTop: space.sm }} />
      </Card>
    </ScrollView>
  );
}

function Row({ icon, label, onPress }: { icon: number; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.subtle }]}>
      <Icon source={icon} size={20} />
      <AppText variant="bodyBold">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
});
