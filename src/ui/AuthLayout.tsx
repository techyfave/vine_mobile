import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { images } from './assets';
import { AppText, Divider } from './components';
import { enter, exit, layout, timing } from './motion';
import { RevealContext } from './reveal';
import { colors, radius, space } from './theme';

const LOGO_RATIO = 640 / 847;


/**
 * Auth screens: photo background with a navy wash, "Get Connected With" + the Vine logo on top, and
 * the light form sheet underneath.
 *
 * Keyboard: Android draws edge to edge, so the window no longer shrinks when the keyboard opens and it
 * covers the lower fields. Instead this layout (1) shrinks the hero to a small logo while typing, so the
 * form moves up, (2) pads the scroll area by the keyboard's height, and (3) scrolls the focused field
 * into the visible area.
 */
export function AuthLayout({
  title,
  subtitle,
  header,
  children,
  compactHero = false,
}: {
  title: string;
  subtitle?: string;
  header?: ReactNode; // shown above the title (e.g. step progress)
  background?: 'login' | 'signup'; // kept for when a licensed login photo is added
  children: ReactNode;
  compactHero?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const [keyboard, setKeyboard] = useState(0);

  const reveal = useCallback(() => {
    // Wait a frame so layout reflects the collapsed hero / keyboard padding.
    setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput?.();
      const content = contentRef.current;
      if (!input || !content) return;
      input.measureLayout(
        content,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 140), animated: true }),
        () => {},
      );
    }, 80);
  }, []);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => {
      setKeyboard(e.endCoordinates.height);
      reveal();
    });
    const hide = Keyboard.addListener(hideEvt, () => {
      setKeyboard(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [reveal]);

  const typing = keyboard > 0;
  const logoWidth = typing ? 64 : compactHero ? 104 : 136;
  const logoW = useSharedValue(logoWidth);
  useEffect(() => {
    logoW.value = withTiming(logoWidth, timing());
  }, [logoWidth, logoW]);
  const logoStyle = useAnimatedStyle(() => ({ width: logoW.value, height: logoW.value * LOGO_RATIO }));

  return (
    <RevealContext.Provider value={reveal}>
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <Image source={images.authSignup} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(59,116,181,0.34)', colors.primary]}
          locations={[0.1, 0.85]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + (typing ? space.sm : space.lg),
            paddingBottom: (typing ? keyboard : insets.bottom) + space.lg,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View ref={contentRef} style={{ flexGrow: 1 }}>
            <Animated.View
              entering={enter.fade()}
              layout={layout}
              style={[styles.hero, (compactHero || typing) && { paddingVertical: typing ? space.sm : space.md }]}
            >
              {typing ? null : (
                <Animated.View entering={enter.fade()} exiting={exit.fade()}>
                  <AppText variant="hero" color={colors.white} style={compactHero ? { fontSize: 28, lineHeight: 34 } : undefined}>
                    Get Connected With
                  </AppText>
                </Animated.View>
              )}
              <Animated.View layout={layout} style={logoStyle}>
                <Image source={images.vineLogoWhite} style={{ flex: 1 }} contentFit="contain" accessibilityLabel="Vine" />
              </Animated.View>
            </Animated.View>
            <Animated.View entering={enter.reveal(80)} layout={layout} style={styles.sheet}>
              {header}
              {/* Keyed by title so a new step's heading eases in instead of snapping. */}
              <Animated.View key={title} entering={enter.fade()} style={{ gap: space.xs }}>
                <AppText variant="display">{title}</AppText>
                {subtitle ? <AppText color={colors.textMuted}>{subtitle}</AppText> : null}
              </Animated.View>
              <Divider />
              {children}
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </RevealContext.Provider>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  sheet: {
    flexGrow: 1,
    marginHorizontal: space.lg,
    backgroundColor: colors.subtle,
    borderRadius: radius.xxl,
    borderWidth: 3,
    borderColor: 'rgba(38,74,116,0.5)',
    padding: space.xl,
    gap: space.lg,
  },
});
