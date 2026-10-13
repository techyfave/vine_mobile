import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, PressableScale } from './components';
import { duration, easing } from './motion';
import { colors, radius, space } from './theme';

export type SheetAction = {
  label: string;
  hint?: string;
  destructive?: boolean;
  onPress: () => void;
};

/**
 * Bottom sheet of choices (post menus, report reasons, audience). Same look on iOS and Android,
 * and no 3-button limit like Android alerts.
 */
export function ActionSheet({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(duration.fast)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(duration.base).easing(easing)}
        style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}
      >
        <View style={styles.handle} />
        {title ? (
          <AppText variant="heading" style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
            {title}
          </AppText>
        ) : null}
        {actions.map((a) => (
          <PressableScale
            key={a.label}
            scaleTo={0.98}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              // Let the sheet close first: iOS can't present an alert or another sheet over a closing modal.
              setTimeout(a.onPress, 250);
            }}
            style={styles.row}
          >
            <AppText variant="bodyBold" color={a.destructive ? colors.danger : colors.primary}>
              {a.label}
            </AppText>
            {a.hint ? (
              <AppText variant="caption" color={colors.textMuted}>
                {a.hint}
              </AppText>
            ) : null}
          </PressableScale>
        ))}
        <PressableScale scaleTo={0.98} accessibilityRole="button" onPress={onClose} style={[styles.row, styles.cancel]}>
          <AppText variant="bodyBold" color={colors.textMuted}>
            Cancel
          </AppText>
        </PressableScale>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: space.sm,
    gap: 2,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: space.md },
  row: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: 2 },
  cancel: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: space.xs },
});
