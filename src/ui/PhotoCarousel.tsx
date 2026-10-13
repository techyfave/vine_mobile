import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { remoteImage } from '@/lib/media';

import { AppText } from './components';
import { timing } from './motion';
import { colors, radius, space } from './theme';

const ASPECT = 4 / 3;

/**
 * A post's photos: one photo shows on its own; several swipe side to side with dots and a
 * "2/5" counter. Tapping a photo calls onOpen with its index (for the full-screen viewer).
 */
export function PhotoCarousel({ urls, onOpen }: { urls: string[]; onOpen: (index: number) => void }) {
  const [width, setWidth] = useState(0);
  const [current, setCurrent] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (urls.length === 1) {
    return (
      <Pressable onPress={() => onOpen(0)} accessibilityRole="imagebutton" accessibilityLabel="View photo">
        <Image source={remoteImage(urls[0] ?? '')} style={styles.single} contentFit="cover" transition={200} />
      </Pressable>
    );
  }

  return (
    <View onLayout={onLayout} style={{ gap: space.sm }}>
      <View style={styles.frame}>
        {width > 0 ? (
          <FlatList
            data={urls}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(u, i) => `${i}:${u}`}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => onOpen(index)} accessibilityRole="imagebutton" accessibilityLabel={`View photo ${index + 1} of ${urls.length}`}>
                <Image source={remoteImage(item)} style={{ width, height: width / ASPECT }} contentFit="cover" transition={200} />
              </Pressable>
            )}
          />
        ) : null}
        <View style={styles.counter} pointerEvents="none">
          <AppText variant="caption" color={colors.white}>
            {current + 1}/{urls.length}
          </AppText>
        </View>
      </View>
      <View style={styles.dots} accessibilityElementsHidden>
        {urls.map((u, i) => (
          <Dot key={`${i}:${u}`} active={i === current} />
        ))}
      </View>
    </View>
  );
}

const DOT_TIMING = timing();

function Dot({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 18 : 6, DOT_TIMING),
    backgroundColor: active ? colors.primary : colors.border,
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  single: { width: '100%', aspectRatio: ASPECT, borderRadius: radius.xl, backgroundColor: colors.cardMuted },
  frame: { width: '100%', aspectRatio: ASPECT, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.cardMuted },
  counter: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
});
