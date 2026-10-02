import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { uploadForm } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { displayName } from '@/lib/time';
import { icons } from '@/ui/assets';
import { AppText, Avatar, Button, ErrorText, Icon } from '@/ui/components';
import { colors, fonts, radius, space } from '@/ui/theme';

type Visibility = 'public' | 'followers';

export default function CreatePost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { photo } = useLocalSearchParams<{ photo?: string }>();
  const [content, setContent] = useState('');
  const [scripture, setScripture] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: true });
    if (!res.canceled && res.assets[0]) setImage(res.assets[0]);
  }

  useEffect(() => {
    if (photo) pick();
  }, [photo]);

  const submit = useMutation({
    // Multipart upload: built by hand because the typed client sends JSON.
    mutationFn: () =>
      uploadForm('/api/v1/feed/posts/', () => {
        const form = new FormData();
        form.append('content', content.trim());
        form.append('visibility', visibility);
        if (scripture.trim()) form.append('scripture_reference', scripture.trim());
        if (image) {
          form.append('upload', {
            uri: image.uri,
            name: image.fileName ?? 'photo.jpg',
            type: image.mimeType ?? 'image/jpeg',
          } as unknown as Blob);
        }
        return form;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      router.back();
    },
  });

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
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder={`What do you have in mind, ${user?.first_name || user?.username}?`}
        placeholderTextColor={colors.textMuted}
        multiline
        autoFocus={!photo}
        maxLength={10000}
        style={styles.body}
      />
      <TextInput
        value={scripture}
        onChangeText={setScripture}
        placeholder="Scripture reference (optional), e.g. John 3:16"
        placeholderTextColor={colors.textMuted}
        maxLength={120}
        style={styles.scripture}
      />
      {image ? (
        <View>
          <Image source={{ uri: image.uri }} style={styles.preview} contentFit="cover" />
          <Button title="Remove photo" variant="ghost" size="sm" onPress={() => setImage(null)} />
        </View>
      ) : null}
      <Pressable accessibilityRole="button" onPress={pick} style={styles.addRow}>
        <AppText variant="caption" color={colors.textMuted}>
          Add to your post
        </AppText>
        <Icon source={icons.camera} size={20} />
      </Pressable>
      <ErrorText>{submit.error ? errorMessage(submit.error) : undefined}</ErrorText>
      <Button title="Post" onPress={() => submit.mutate()} loading={submit.isPending} disabled={!content.trim() && !image} />
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
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.xl },
  addRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: space.md,
  },
});
