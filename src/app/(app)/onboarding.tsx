import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { icons, images } from '@/ui/assets';
import { AppText, Button, Icon, PressableScale } from '@/ui/components';
import { duration, enter, timing } from '@/ui/motion';
import { colors, space } from '@/ui/theme';

import { useOnboarding } from './_layout';

const SLIDES = [
  { title: 'Get Started With', subtitle: 'A place to connect and build spiritually' },
  { title: 'Connect With Likeminds', subtitle: 'A place to grow together' },
  { title: 'Share Your Opinions', subtitle: 'And core values about the scripture' },
];

/** The design's 3-step "Get Started" carousel, shown once per account on this device. */
export default function Onboarding() {
  const { user } = useAuth();
  const { finish } = useOnboarding();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const goTo = (n: number) => {
    setDirection(n > i ? 'forward' : 'back');
    setI(n);
  };
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <Image source={images.onboarding[i]} style={StyleSheet.absoluteFill} contentFit="cover" transition={duration.slow} />
      <LinearGradient colors={['rgba(38,74,116,0.35)', 'rgba(38,74,116,0.9)']} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]}>
        <Animated.View
          key={i}
          entering={direction === 'forward' ? enter.forward() : enter.back()}
          style={{ alignItems: 'center', gap: space.lg }}
        >
          {i === 0 ? (
            <AppText variant="label" color={colors.white}>
              Welcome {user?.first_name || user?.username}
            </AppText>
          ) : null}
          <AppText variant="hero" color={colors.white} style={{ textAlign: 'center', fontSize: 38, lineHeight: 44 }}>
            {slide.title}
          </AppText>
          <AppText variant="bodyBold" color={colors.white} style={{ textAlign: 'center' }}>
            {slide.subtitle}
          </AppText>
        </Animated.View>

        <Animated.View entering={enter.reveal(120)}>
          <Image source={images.vineLogoWhite} style={{ width: 150, height: 113 }} contentFit="contain" accessibilityLabel="Vine" />
        </Animated.View>

        <View style={{ gap: space.xl }}>
          <View style={styles.dots}>
            {SLIDES.map((s, idx) => (
              <Dot key={s.title} active={idx === i} />
            ))}
          </View>
          <View style={styles.actions}>
            {i > 0 ? (
              <PressableScale accessibilityRole="button" accessibilityLabel="Back" onPress={() => goTo(i - 1)} style={styles.back}>
                <Icon source={icons.back} size={18} />
              </PressableScale>
            ) : (
              <AppText variant="bodyBold" color={colors.white} onPress={finish} accessibilityRole="button">
                Skip
              </AppText>
            )}
            <Button
              title={last ? 'Get Started' : 'Next'}
              variant="light"
              size="sm"
              onPress={() => (last ? finish() : goTo(i + 1))}
              style={{ minWidth: 110 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Progress dash: the active one stretches and brightens. */
function Dot({ active }: { active: boolean }) {
  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(active ? 1 : 0, timing());
  }, [active, p]);
  const style = useAnimatedStyle(() => ({ width: 22 + 10 * p.value, opacity: 0.4 + 0.6 * p.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xxl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
  dot: { height: 4, borderRadius: 2, backgroundColor: colors.white },
  actions: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minWidth: 300 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
