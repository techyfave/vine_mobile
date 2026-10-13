import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { errorMessage } from '@/api/errors';
import { useLiftUpdate } from '@/features/feed/api';
import { useKeyboardHeight } from '@/lib/keyboard';
import { AppText, Button, ErrorText, PressableScale } from '@/ui/components';
import { layout } from '@/ui/motion';
import { colors, fonts, radius, space } from '@/ui/theme';

/**
 * The author coming back to their Lift: how things are going, or a testimony once it's answered.
 * Everyone who prayed or stood with them gets a notification.
 */
export default function LiftUpdateScreen() {
  const { id, testimony: startAsTestimony } = useLocalSearchParams<{ id: string; testimony?: string }>();
  const keyboard = useKeyboardHeight();
  const update = useLiftUpdate();
  const [body, setBody] = useState('');
  const [testimony, setTestimony] = useState(Boolean(startAsTestimony));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.white }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: keyboard + space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.segment}>
        {[
          { value: false, label: 'Update' },
          { value: true, label: '🙌 Testimony' },
        ].map((o) => (
          <PressableScale
            key={o.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: testimony === o.value }}
            onPress={() => setTestimony(o.value)}
            scaleTo={0.97}
            style={[styles.segmentItem, testimony === o.value && styles.segmentOn]}
          >
            <AppText variant="bodyBold" color={testimony === o.value ? colors.white : colors.lift}>
              {o.label}
            </AppText>
          </PressableScale>
        ))}
      </View>
      <Animated.View layout={layout}>
        <AppText variant="caption" color={colors.textMuted}>
          {testimony
            ? 'Share how it turned out. Your Lift will show as answered, and everyone who stood with you will be told.'
            : "Let people know how it's going. Everyone who prayed or stood with you will be told."}
        </AppText>
      </Animated.View>
      <TextInput
        value={body}
        onChangeText={setBody}
        multiline
        autoFocus
        maxLength={2000}
        placeholder={testimony ? 'What happened?' : "How's it going?"}
        placeholderTextColor={colors.textMuted}
        style={styles.body}
      />
      {update.error ? <ErrorText>{errorMessage(update.error)}</ErrorText> : null}
      <Button
        title={testimony ? 'Share testimony' : 'Post update'}
        loading={update.isPending}
        disabled={!body.trim()}
        onPress={() => update.mutate({ postId: id, body: body.trim(), testimony }, { onSuccess: () => router.back() })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: space.sm },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.lift,
  },
  segmentOn: { backgroundColor: colors.lift },
  body: { minHeight: 160, fontFamily: fonts.regular, fontSize: 18, color: colors.primary, textAlignVertical: 'top' },
});
