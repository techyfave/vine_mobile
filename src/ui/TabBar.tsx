import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { icons } from './assets';
import { RingButton } from './components';
import { colors, shadow, space } from './theme';

const TAB_ICONS: Record<string, { icon: number; label: string }> = {
  index: { icon: icons.home, label: 'Home' },
  messages: { icon: icons.chat, label: 'Messages' },
  notifications: { icon: icons.notification, label: 'Notifications' },
  live: { icon: icons.live, label: 'Live' },
};

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
  badges?: Partial<Record<string, number>>;
};

/** Frosted bottom bar with the design's dashed rings (solid ring + underline = active tab). */
export function TabBar({ state, navigation, badges }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, shadow.bar]}>
      <BlurView intensity={40} tint="light" style={[styles.bar, { paddingBottom: insets.bottom + space.sm }]}>
        {state.routes.map((route, i) => {
          const meta = TAB_ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          const badge = badges?.[route.name];
          return (
            <View key={route.key} style={styles.item}>
              <RingButton
                icon={meta.icon}
                label={badge ? `${meta.label}, ${badge} unread` : meta.label}
                active={focused}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
              />
              {badge ? <View style={styles.badge} /> : null}
              <View style={[styles.underline, focused && { backgroundColor: colors.link }]} />
            </View>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xxl,
    paddingTop: space.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  item: { alignItems: 'center', gap: 6 },
  underline: { width: 28, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.live,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
