import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { remoteImage } from '@/lib/media';

import { AppText } from './components';
import { enter } from './motion';
import { colors, space } from './theme';

/**
 * Full-screen photo viewer (profile photos, covers, post images). Tap anywhere or the close
 * button to dismiss; Android's back button closes it too.
 */
export function ImageViewer({ uri, onClose }: { uri: string | null | undefined; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={Boolean(uri)} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close photo">
        {uri ? (
          <Animated.View entering={enter.pop()} style={StyleSheet.absoluteFill}>
            <Image source={remoteImage(uri)} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel="Photo" />
          </Animated.View>
        ) : null}
        <View style={[styles.close, { top: insets.top + space.md }]}>
          <AppText variant="title" color={colors.white} style={{ lineHeight: 26 }}>
            ×
          </AppText>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  close: {
    position: 'absolute',
    right: space.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
