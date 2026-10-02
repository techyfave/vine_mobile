import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { icons, images } from '@/ui/assets';
import { AppText, Button, Icon } from '@/ui/components';
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
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <Image source={images.onboarding[i]} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient colors={['rgba(38,74,116,0.35)', 'rgba(38,74,116,0.9)']} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]}>
        <View style={{ alignItems: 'center', gap: space.lg }}>
          {i === 0 ? (
            <AppText variant="title" color={colors.white} style={{ fontWeight: '300' }}>
              Welcome {user?.first_name || user?.username}
            </AppText>
          ) : null}
          <AppText variant="script" color={colors.white} style={{ textAlign: 'center' }}>
            {slide.title}
          </AppText>
          <AppText variant="bodyBold" color={colors.white} style={{ textAlign: 'center' }}>
            {slide.subtitle}
          </AppText>
        </View>

        <Image source={images.logoWordmarkWhite} style={{ width: 150, height: 98 }} contentFit="contain" accessibilityLabel="Vine" />

        <View style={{ gap: space.xl }}>
          <View style={styles.dots}>
            {SLIDES.map((s, idx) => (
              <View key={s.title} style={[styles.dot, idx === i && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.actions}>
            {i > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => setI(i - 1)} style={styles.back}>
                <Icon source={icons.back} size={18} />
              </Pressable>
            ) : (
              <AppText variant="bodyBold" color={colors.white} onPress={finish} accessibilityRole="button">
                Skip
              </AppText>
            )}
            <Button
              title={last ? 'Get Started' : 'Next'}
              variant="light"
              size="sm"
              onPress={() => (last ? finish() : setI(i + 1))}
              style={{ minWidth: 110 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xxl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
  dot: { width: 22, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: colors.white, width: 32 },
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
