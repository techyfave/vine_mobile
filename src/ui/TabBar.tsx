import { router } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';

import { icons } from './assets';
import { AppText, Avatar, Icon, PressableScale } from './components';
import { colors, shadow, space } from './theme';

const TABS: Record<string, { icon: number; iconOn: number; label: string }> = {
  index: { icon: icons.tabHome, iconOn: icons.tabHomeOn, label: 'Home' },
  watch: { icon: icons.tabWatch, iconOn: icons.tabWatchOn, label: 'Watch' },
  grapevine: { icon: icons.tabGrapevine, iconOn: icons.tabGrapevineOn, label: 'Grapevine' },
  you: { icon: 0, iconOn: 0, label: 'You' },
};

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
};

/** Room screens leave at the bottom so the floating bar never covers content. */
export const TAB_BAR_SPACE = 110;

/** Floating ink pill: Home, Watch, Create (lime), Grapevine, You. Active tab = lime icon on a raised dot. */
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) + 4 }]}>
      <View style={[styles.bar, shadow.bar]}>
        {state.routes.map((route, i) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          const press = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Fragment key={route.key}>
              <PressableScale
                accessibilityRole="tab"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: focused }}
                onPress={press}
                scaleTo={0.9}
                style={[styles.item, focused && styles.itemOn]}
              >
                {route.name === 'you' ? (
                  <YouGlyph uri={user?.profile_picture} initials={initials(user)} focused={focused} />
                ) : (
                  <Icon source={focused ? meta.iconOn : meta.icon} size={24} tint={focused ? colors.accent : colors.inkMuted} />
                )}
              </PressableScale>
              {route.name === 'watch' ? (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Create a post"
                  onPress={() => router.push('/create-post')}
                  scaleTo={0.9}
                  style={styles.create}
                >
                  <Icon source={icons.plus} size={24} tint={colors.ink} />
                </PressableScale>
              ) : null}
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

function YouGlyph({ uri, initials, focused }: { uri?: string | null; initials: string; focused: boolean }) {
  if (uri) {
    return (
      <View style={[styles.youRing, focused && { borderColor: colors.accent }]}>
        <Avatar uri={uri} size={26} />
      </View>
    );
  }
  return (
    <View style={[styles.youInitials, focused && { backgroundColor: colors.accent }]}>
      <AppText variant="label" color={colors.ink} style={{ fontSize: 11, lineHeight: 13 }}>
        {initials}
      </AppText>
    </View>
  );
}

function initials(user: { first_name?: string | null; last_name?: string | null; username?: string } | null | undefined) {
  if (!user) return '';
  const a = user.first_name?.[0] ?? user.username?.[0] ?? '';
  const b = user.last_name?.[0] ?? '';
  return (a + b).toUpperCase();
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.md, right: space.md },
  bar: {
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: space.sm,
  },
  item: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  itemOn: { backgroundColor: colors.inkRaised },
  create: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youRing: { borderRadius: 16, borderWidth: 2, borderColor: 'transparent', padding: 1 },
  youInitials: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
