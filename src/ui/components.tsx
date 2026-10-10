import { Image, type ImageSource } from 'expo-image';
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type DimensionValue,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  type TextProps,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { icons } from './assets';
import { duration, spring, timing } from './motion';
import { useRevealFocused } from './reveal';
import { colors, fonts, radius, shadow, space } from './theme';

// --- Typography ---------------------------------------------------------------------

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyBold' | 'caption' | 'label' | 'hero';

export function AppText({
  variant = 'body',
  color = colors.primary,
  style,
  ...props
}: TextProps & { variant?: Variant; color?: string }) {
  return <Text {...props} style={[type[variant], { color }, style]} />;
}

const type = StyleSheet.create({
  display: { fontFamily: fonts.brand, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: fonts.brand, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyBold: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17 },
  label: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 22 },
  /** Big welcoming lines on photo backgrounds ("Get Connected With"). */
  hero: { fontFamily: fonts.brandMedium, fontSize: 34, lineHeight: 40 },
});

// --- Icons & avatars ------------------------------------------------------------------

export function Icon({ source, size = 20, tint }: { source: ImageSource | number; size?: number; tint?: string }) {
  return <Image source={source} style={{ width: size, height: size }} contentFit="contain" tintColor={tint} />;
}

export function Avatar({ uri, size = 44 }: { uri?: string | null; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: colors.primary,
        backgroundColor: colors.cardMuted,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
      ) : (
        <PersonGlyph size={size * 0.55} />
      )}
    </View>
  );
}

function PersonGlyph({ size }: { size: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{ width: size * 0.45, height: size * 0.45, borderRadius: size, backgroundColor: colors.softBlue }}
      />
      <View
        style={{
          width: size * 0.8,
          height: size * 0.38,
          marginTop: size * 0.06,
          borderTopLeftRadius: size,
          borderTopRightRadius: size,
          backgroundColor: colors.softBlue,
        }}
      />
    </View>
  );
}

// --- Surfaces ----------------------------------------------------------------------------

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <View style={styles.rule} />;
  return (
    <View style={styles.orRow}>
      <View style={[styles.rule, { flex: 1 }]} />
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <View style={[styles.rule, { flex: 1 }]} />
    </View>
  );
}

// --- Inputs ------------------------------------------------------------------------------

export function Input({ secureTextEntry, style, ref, ...props }: TextInputProps & { ref?: Ref<TextInput> }) {
  const [hidden, setHidden] = useState(true);
  const reveal = useRevealFocused();
  return (
    <View style={styles.inputWrap}>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        secureTextEntry={secureTextEntry ? hidden : false}
        accessibilityLabel={props.placeholder}
        {...props}
        onFocus={(e) => {
          reveal();
          props.onFocus?.(e);
        }}
      />
      {secureTextEntry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          hitSlop={12}
          onPress={() => setHidden((h) => !h)}
          style={styles.eye}
        >
          <Icon source={icons.eye} size={18} tint={hidden ? colors.textMuted : colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <AppText variant="caption" color={colors.danger} accessibilityRole="alert">
      {children}
    </AppText>
  );
}

// --- Motion primitives -----------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that sinks slightly while held. Every tappable surface uses this for the same feel. */
export function PressableScale({
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...props
}: Omit<PressableProps, 'style'> & { scaleTo?: number; style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, spring);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring);
        onPressOut?.(e);
      }}
      style={[style, animated]}
    />
  );
}

/** Wraps an icon and gives it a quick "pop" whenever `active` turns on (likes, saves). */
export function Pop({ active, children }: { active: boolean; children: ReactNode }) {
  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false; // no pop for posts that load already liked
      return;
    }
    if (active) scale.value = withSequence(withTiming(1.35, timing(duration.fast)), withSpring(1, spring));
  }, [active, scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={animated}>{children}</Animated.View>;
}

/** Placeholder block that gently pulses while content loads. */
export function Skeleton({
  width = '100%',
  height = 14,
  round = 6,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  round?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, timing(900)), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius: round, backgroundColor: colors.cardMuted }, style, animated]} />;
}

// --- Buttons -------------------------------------------------------------------------------

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'light';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const v = buttonVariants[variant];
  const off = disabled || loading;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      onPress={onPress}
      disabled={off}
      style={[
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: v.bg, borderColor: v.border },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <AppText variant={size === 'sm' ? 'caption' : 'bodyBold'} color={v.fg}>
          {title}
        </AppText>
      )}
    </PressableScale>
  );
}

const buttonVariants = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  outline: { bg: colors.white, fg: colors.primary, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  danger: { bg: colors.danger, fg: colors.white, border: colors.danger },
  light: { bg: colors.white, fg: colors.primary, border: colors.white },
};

/** Round white button holding a provider logo (Continue with Apple / Google). */
export function SocialButton({
  icon,
  label,
  onPress,
  loading,
}: {
  icon: number;
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={loading}
      style={styles.social}
    >
      {loading ? <ActivityIndicator color={colors.primary} /> : <Icon source={icon} size={30} />}
    </PressableScale>
  );
}

/** Circle used in the composer's "Add to your post" row and the tab bar. */
export function RingButton({
  icon,
  label,
  onPress,
  active,
  size = 42,
  iconSize = 18,
  dashed = true,
}: {
  icon: number;
  label: string;
  onPress?: () => void;
  active?: boolean;
  size?: number;
  iconSize?: number;
  dashed?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      scaleTo={0.9}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderStyle: active || !dashed ? 'solid' : 'dashed',
        borderColor: active ? colors.primary : colors.link,
        backgroundColor: colors.subtle,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon source={icon} size={iconSize} />
    </PressableScale>
  );
}

export function LinkText({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <AppText variant="caption" color={colors.primary} onPress={onPress} style={{ textDecorationLine: 'underline' }}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: space.lg, ...shadow.card },
  rule: { height: 1, backgroundColor: colors.border },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  inputWrap: { justifyContent: 'center' },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.primary,
  },
  eye: { position: 'absolute', right: space.lg },
  button: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  buttonSm: { minHeight: 34, paddingHorizontal: space.md, borderRadius: 8 },
  social: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
