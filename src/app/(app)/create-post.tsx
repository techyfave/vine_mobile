import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { uploadForm } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { displayName } from '@/lib/time';
import { icons } from '@/ui/assets';
import type { LiftMode } from '@/features/feed/api';
import { AppText, Avatar, Button, ErrorText, Icon, PressableScale } from '@/ui/components';
import { enter, exit, layout } from '@/ui/motion';
import { colors, fonts, radius, space } from '@/ui/theme';

const MAX_PHOTOS = 6;

type Visibility = 'public' | 'followers';
type LiftChoice = 'off' | LiftMode;

const LIFT_OPTIONS: { value: LiftMode; label: string; hint: string }[] = [
  { value: 'pray_or_support', label: 'Prayer or support', hint: 'People can pray for you or stand with you' },
  { value: 'support_only', label: 'Support only', hint: "People stand with you; no prayer offers" },
];

export default function CreatePost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { photo, lift: liftParam } = useLocalSearchParams<{ photo?: string; lift?: string }>();
  const [content, setContent] = useState('');
  const [scripture, setScripture] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [lift, setLift] = useState<LiftChoice>(liftParam ? 'pray_or_support' : 'off');
  const [progress, setProgress] = useState(0);
  const room = MAX_PHOTOS - images.length;

  async function pick() {
    if (room <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: room > 1,
      selectionLimit: room,
      orderedSelection: true,
      // The picker can only crop one photo at a time.
      allowsEditing: room === 1,
    });
    if (!res.canceled)
      setImages((cur) => {
        const fresh = res.assets.filter((a) => !cur.some((c) => c.uri === a.uri));
        return [...cur, ...fresh].slice(0, MAX_PHOTOS);
      });
  }

  useEffect(() => {
    if (photo) pick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  const submit = useMutation({
    // Multipart upload: built by hand because the typed client sends JSON.
    mutationFn: () => {
      setProgress(0);
      return uploadForm(
        '/api/v1/feed/posts/',
        () => {
          const form = new FormData();
          form.append('content', content.trim());
          form.append('visibility', visibility);
          if (scripture.trim()) form.append('scripture_reference', scripture.trim());
          if (lift !== 'off') form.append('lift_mode', lift);
          images.forEach((img, i) =>
            form.append('uploads', {
              uri: img.uri,
              name: img.fileName ?? `photo-${i + 1}.jpg`,
              type: img.mimeType ?? 'image/jpeg',
            } as unknown as Blob),
          );
          return form;
        },
        { onProgress: images.length ? setProgress : undefined },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      router.back();
    },
  });

  const isLift = lift !== 'off';
  const canPost = isLift ? Boolean(content.trim()) : Boolean(content.trim() || images.length);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
      <View style={styles.author}>
        <Avatar uri={user?.profile_picture} size={44} />
        <View style={{ gap: 4 }}>
          <AppText variant="heading">{user ? displayName(user) : ''}</AppText>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {(['public', 'followers'] as const).map((v) => (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityState={{ selected: visibility === v }}
                onPress={() => setVisibility(v)}
                style={[styles.chip, visibility === v && styles.chipOn]}
              >
                <AppText variant="caption" color={visibility === v ? colors.white : colors.primary}>
                  {v === 'public' ? 'Public' : 'Followers'}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <PressableScale
        accessibilityRole="switch"
        accessibilityState={{ checked: isLift }}
        onPress={() => setLift(isLift ? 'off' : 'pray_or_support')}
        scaleTo={0.98}
        style={[styles.liftToggle, isLift && styles.liftToggleOn]}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyBold" color={isLift ? colors.lift : colors.primary}>
            🙏 Ask for a Lift
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Going through something? Let people pray for you or stand with you.
          </AppText>
        </View>
        <View style={[styles.switch, isLift && styles.switchOn]}>
          <Animated.View layout={layout} style={[styles.knob, isLift && { alignSelf: 'flex-end' }]} />
        </View>
      </PressableScale>
      {isLift ? (
        <Animated.View entering={enter.rise()} style={{ gap: space.sm }}>
          {LIFT_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: lift === o.value }}
              onPress={() => setLift(o.value)}
              style={[styles.liftOption, lift === o.value && styles.liftOptionOn]}
            >
              <View style={[styles.radio, lift === o.value && styles.radioOn]} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{o.label}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {o.hint}
                </AppText>
              </View>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder={
          isLift ? 'What would you like people to stand with you on?' : `What do you have in mind, ${user?.first_name || user?.username}?`
        }
        placeholderTextColor={colors.textMuted}
        multiline
        autoFocus={!photo && !liftParam}
        maxLength={10000}
        style={styles.body}
      />
      {!isLift ? (
        <TextInput
          value={scripture}
          onChangeText={setScripture}
          placeholder="Scripture reference (optional), e.g. John 3:16"
          placeholderTextColor={colors.textMuted}
          maxLength={120}
          style={styles.scripture}
        />
      ) : null}

      {images.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {images.map((img, i) => (
            <Animated.View key={img.uri} entering={enter.pop()} exiting={exit.fade()} layout={layout}>
              <Image source={{ uri: img.uri }} style={styles.thumb} contentFit="cover" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                hitSlop={8}
                onPress={() => setImages((cur) => cur.filter((x) => x.uri !== img.uri))}
                style={styles.remove}
              >
                <AppText variant="caption" color={colors.white}>
                  ×
                </AppText>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      ) : null}

      <Pressable accessibilityRole="button" onPress={pick} disabled={room <= 0} style={styles.addRow}>
        <AppText variant="caption" color={colors.textMuted}>
          {room <= 0 ? `${MAX_PHOTOS} photos is the most for one post` : images.length ? `Add more photos (${images.length}/${MAX_PHOTOS})` : 'Add photos'}
        </AppText>
        <Icon source={icons.camera} size={20} />
      </Pressable>

      {submit.isPending && images.length ? (
        <View style={{ gap: 6 }}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <AppText variant="caption" color={colors.textMuted}>
            {progress < 1 ? `Uploading ${images.length === 1 ? 'photo' : `${images.length} photos`}… ${Math.round(progress * 100)}%` : 'Almost done…'}
          </AppText>
        </View>
      ) : null}
      <ErrorText>{submit.error ? errorMessage(submit.error) : undefined}</ErrorText>
      <Button title={isLift ? 'Ask for a Lift' : 'Post'} onPress={() => submit.mutate()} loading={submit.isPending} disabled={!canPost} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  author: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  body: { minHeight: 140, fontFamily: fonts.regular, fontSize: 18, color: colors.primary, textAlignVertical: 'top' },
  scripture: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: space.md,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.primary,
  },
  thumb: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.cardMuted },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.cardMuted, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  liftToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  liftToggleOn: { borderColor: colors.liftBorder, backgroundColor: colors.liftSoft },
  switch: { width: 44, height: 26, borderRadius: 13, backgroundColor: colors.border, padding: 3 },
  switchOn: { backgroundColor: colors.lift },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  liftOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  liftOptionOn: { borderColor: colors.lift, backgroundColor: colors.liftSoft },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.lift, borderWidth: 6 },
  addRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: space.md,
  },
});
