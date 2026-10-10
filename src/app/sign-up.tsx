import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { type TextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { SocialRow } from '@/auth/SocialRow';
import { AuthLayout } from '@/ui/AuthLayout';
import { AppText, Button, Divider, ErrorText, Input, LinkText, PressableScale } from '@/ui/components';
import { enter, spring, timing } from '@/ui/motion';
import { colors, space } from '@/ui/theme';

/**
 * Sign up in three short steps (name → email → password). Each step has at most two fields, so the
 * whole step stays visible above the keyboard, and the leaf row shows how far along you are.
 */
type Step = 0 | 1 | 2;

const STEPS = [
  { title: 'Get Started', subtitle: 'First, what should we call you?' },
  { title: 'Your Email', subtitle: "We'll send a 6-digit code to confirm it's you." },
  { title: 'Create a Password', subtitle: 'Use at least 10 characters.' },
] as const;

const MIN_PASSWORD = 10;
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function SignUp() {
  const { signUp } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const lastName = useRef<TextInput>(null);
  const confirm = useRef<TextInput>(null);

  const set = (k: keyof typeof form) => (v: string) => {
    setError(undefined);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const go = (s: Step) => {
    setError(undefined);
    setDirection(s > step ? 'forward' : 'back');
    setStep(s);
  };

  const nameOk = form.first_name.trim().length > 0;
  const emailOk = looksLikeEmail(form.email);
  const passwordOk = form.password.length >= MIN_PASSWORD;
  const matches = form.confirm_password.length > 0 && form.password === form.confirm_password;

  async function submit() {
    if (!passwordOk) return setError(`Password must be at least ${MIN_PASSWORD} characters`);
    if (!matches) return setError('Passwords do not match');
    setError(undefined);
    setLoading(true);
    try {
      await signUp({
        ...form,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
    } catch (err) {
      const message = errorMessage(err);
      if (/email/i.test(message)) go(1); // e.g. email already in use: show it next to the email field
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const fullName = `${form.first_name.trim()} ${form.last_name.trim()}`.trim();

  return (
    <AuthLayout
      title={STEPS[step].title}
      subtitle={STEPS[step].subtitle}
      header={<Leaves step={step} />}
      background="signup"
      compactHero
    >
      <Animated.View
        key={step}
        entering={direction === 'forward' ? enter.forward() : enter.back()}
        style={{ gap: space.lg }}
      >
        {step === 0 ? (
          <>
            <SocialRow />
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="First Name"
                  value={form.first_name}
                  onChangeText={set('first_name')}
                  autoComplete="given-name"
                  textContentType="givenName"
                  autoCapitalize="words"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => lastName.current?.focus()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  ref={lastName}
                  placeholder="Last Name"
                  value={form.last_name}
                  onChangeText={set('last_name')}
                  autoComplete="family-name"
                  textContentType="familyName"
                  autoCapitalize="words"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => nameOk && go(1)}
                />
              </View>
            </View>
            <ErrorText>{error}</ErrorText>
            <Button title="Continue" onPress={() => go(1)} disabled={!nameOk} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Who name={fullName} onEdit={() => go(0)} />
            <Input
              placeholder="Email Address"
              value={form.email}
              onChangeText={set('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => emailOk && go(2)}
            />
            <ErrorText>{error}</ErrorText>
            <Button title="Continue" onPress={() => go(2)} disabled={!emailOk} />
            <BackLink onPress={() => go(0)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Who name={fullName} email={form.email.trim()} onEdit={() => go(1)} />
            <Input
              placeholder={`Password (${MIN_PASSWORD}+ characters)`}
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              autoFocus
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => confirm.current?.focus()}
            />
            <Input
              ref={confirm}
              placeholder="Confirm Password"
              value={form.confirm_password}
              onChangeText={set('confirm_password')}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            {form.confirm_password && !error ? (
              <AppText key={String(matches)} variant="caption" color={matches ? colors.secondary : colors.textMuted}>
                {matches ? '✓ Passwords match' : 'Passwords don’t match yet'}
              </AppText>
            ) : null}
            <ErrorText>{error}</ErrorText>
            <Button title="Create Account" onPress={submit} loading={loading} disabled={!passwordOk || !matches} />
            <BackLink onPress={() => go(1)} />
          </>
        ) : null}
      </Animated.View>

      <Divider />
      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Already have an account? <LinkText onPress={() => router.replace('/sign-in')}>Log In</LinkText>
      </AppText>
    </AuthLayout>
  );
}

/** Three leaves on a stem: they grow and fill in as you move through the steps. */
function Leaves({ step }: { step: Step }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
      accessible
      accessibilityLabel={`Step ${step + 1} of 3`}
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          {i > 0 ? <Stem grown={i <= step} /> : null}
          <Leaf state={i < step ? 2 : i === step ? 1 : 0} />
        </View>
      ))}
      <Animated.View key={step} entering={enter.fade()}>
        <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: space.xs }}>
          Step {step + 1} of 3
        </AppText>
      </Animated.View>
    </View>
  );
}

/** 0 = upcoming, 1 = current, 2 = done. */
function Leaf({ state }: { state: 0 | 1 | 2 }) {
  const fill = useSharedValue(state);
  const scale = useSharedValue(1);
  useEffect(() => {
    fill.value = withTiming(state, timing());
    if (state === 1) scale.value = withSequence(withSpring(1.15, spring), withSpring(1, spring));
  }, [state, fill, scale]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.value, [0, 1, 2], ['rgba(0,0,0,0)', colors.secondary, colors.primary]),
    borderColor: interpolateColor(fill.value, [0, 1, 2], [colors.border, colors.primary, colors.primary]),
    transform: [{ rotate: '-18deg' }, { scale: scale.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          width: 22,
          height: 12,
          borderTopLeftRadius: 12,
          borderBottomRightRadius: 12,
          borderTopRightRadius: 2,
          borderBottomLeftRadius: 2,
          borderWidth: 2,
        },
        style,
      ]}
    />
  );
}

function Stem({ grown }: { grown: boolean }) {
  const p = useSharedValue(grown ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(grown ? 1 : 0, timing());
  }, [grown, p]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.border, colors.primary]),
  }));
  return <Animated.View style={[{ width: 18, height: 2, borderRadius: 1 }, style]} />;
}

/** What has been entered so far; tap to go back and change it. */
function Who({ name, email, onEdit }: { name: string; email?: string; onEdit: () => void }) {
  return (
    <PressableScale
      onPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel="Edit your details"
      scaleTo={0.98}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.md,
        backgroundColor: colors.cardMuted,
        borderRadius: 12,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {name}
        </AppText>
        {email ? (
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
            {email}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color={colors.link}>
        Edit
      </AppText>
    </PressableScale>
  );
}

function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <AppText variant="caption" color={colors.primary} onPress={onPress} style={{ textAlign: 'center' }}>
      ← Back
    </AppText>
  );
}
