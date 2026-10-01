import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, space, useColors } from './theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const c = useColors();
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.screenBody} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenBody, { flex: 1 }]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={[styles.title, { color: c.text }]}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  const c = useColors();
  return <Text style={[styles.body, { color: muted ? c.muted : c.text }]}>{children}</Text>;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  const c = useColors();
  if (!children) return null;
  return (
    <Text accessibilityRole="alert" style={[styles.body, { color: c.danger }]}>
      {children}
    </Text>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: space.xs }}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.muted}
        style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}
        accessibilityLabel={label}
        {...props}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const c = useColors();
  const bg = variant === 'primary' ? c.primary : variant === 'danger' ? c.danger : 'transparent';
  const fg = variant === 'ghost' ? c.primary : c.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.7 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenBody: { padding: space.xl, gap: space.lg },
  title: { fontSize: 28, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.md, fontSize: 16 },
  button: { borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
