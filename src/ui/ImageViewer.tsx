import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { remoteImage } from '@/lib/media';

import { AppText } from './components';
import { enter } from './motion';
import { colors, radius, space } from './theme';

/**
 * Full-screen photo viewer (profile photos, covers, post photos). Swipe between photos when
 * there are several; tap anywhere or the close button to dismiss. Android's back button closes it too.
 *
 * Pass `uri` for a single photo, or `images` + `index` to open a set at a given photo.
 */
export function ImageViewer({
  uri,
  images,
  index = 0,
  onClose,
}: {
  uri?: string | null;
  images?: string[] | null;
  index?: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const list = images?.length ? images : uri ? [uri] : [];
  const visible = list.length > 0;
  const [current, setCurrent] = useState(index);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent onShow={() => setCurrent(index)}>
      <View style={styles.backdrop}>
        {visible ? (
          <Animated.View entering={enter.pop()} style={StyleSheet.absoluteFill}>
            <FlatList
              data={list}
              horizontal
              pagingEnabled
              initialScrollIndex={Math.min(index, list.length - 1)}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(u, i) => `${i}:${u}`}
              onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item }) => (
                <Pressable onPress={onClose} style={{ width, height }} accessibilityLabel="Close photo">
                  <Image source={remoteImage(item)} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel="Photo" />
                </Pressable>
              )}
            />
          </Animated.View>
        ) : null}
        {list.length > 1 ? (
          <View style={[styles.counter, { top: insets.top + space.md }]} pointerEvents="none">
            <AppText variant="caption" color={colors.white}>
              {current + 1} / {list.length}
            </AppText>
          </View>
        ) : null}
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={[styles.close, { top: insets.top + space.md }]}>
          <AppText variant="title" color={colors.white} style={{ lineHeight: 26 }}>
            ×
          </AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
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
