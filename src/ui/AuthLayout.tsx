import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { images } from './assets';
import { AppText, Divider } from './components';
import { colors, radius, space } from './theme';

/**
 * Auth screens from the design: photo background with a navy wash, "Get Spiritual With" + Vine
 * wordmark on top, and the light form sheet with a navy outline underneath.
 */
export function AuthLayout({
  title,
  children,
  compactHero = false,
}: {
  title: string;
  background?: 'login' | 'signup'; // kept for when a licensed login photo is added
  children: ReactNode;
  compactHero?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <Image
        source={images.authSignup}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(59,116,181,0.34)', colors.primary]}
        locations={[0.1, 0.85]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, compactHero && { paddingVertical: space.md }]}>
            <AppText variant="script" color={colors.white} style={compactHero ? { fontSize: 34, lineHeight: 40 } : undefined}>
              Get Spiritual With
            </AppText>
            <Image
              source={images.logoWordmarkWhite}
              style={{ width: compactHero ? 96 : 130, height: compactHero ? 62 : 84 }}
              contentFit="contain"
              accessibilityLabel="Vine"
            />
          </View>
          <View style={styles.sheet}>
            <AppText variant="display">{title}</AppText>
            <Divider />
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
