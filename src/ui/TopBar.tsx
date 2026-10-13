import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { routes } from '@/lib/routes';
import { useAuth } from '@/auth/AuthProvider';

import { images } from './assets';
import { AppText, Avatar } from './components';
import { colors, radius, shadow, space } from './theme';

/** Home header from the mobile design: logo mark, search pill, avatar, menu grid. */
export function TopBar() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.bar}>
        <Image source={images.logoMark} style={{ width: 34, height: 34 }} accessibilityLabel="Vine" />
        <Pressable
          accessibilityRole="search"
          onPress={() => router.push('/search')}
          style={styles.search}
        >
          <SearchGlyph />
          <AppText color={colors.textMuted}>Search</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Your profile" onPress={() => user && router.push(routes.profile(user.username))}>
          <Avatar uri={user?.profile_picture} size={34} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Menu" onPress={() => router.push('/menu')} style={styles.menu}>
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function SearchGlyph() {
  return (
    <View style={{ width: 14, height: 14 }}>
      <View style={{ width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: colors.textMuted }} />
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 5,
          height: 2,
          backgroundColor: colors.textMuted,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.md, paddingBottom: space.sm, backgroundColor: colors.background },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: space.sm,
    ...shadow.card,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 36,
  },
  menu: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { width: 14, height: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  dot: { width: 6, height: 6, borderRadius: 1.5, backgroundColor: colors.primary },
});
