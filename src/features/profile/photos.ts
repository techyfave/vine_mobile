import * as ImagePicker from 'expo-image-picker';

import { uploadForm } from '@/api/client';

const SHAPE = {
  avatar: { aspect: [1, 1] as [number, number], path: '/api/v1/users/me/avatar/', name: 'avatar.jpg' },
  cover: { aspect: [16, 9] as [number, number], path: '/api/v1/users/me/cover/', name: 'cover.jpg' },
};

/**
 * Let the user pick and crop a photo, then upload it as their profile photo or cover.
 * Resolves to false if they cancelled. The server resizes and strips location data.
 */
export async function pickAndUploadProfilePhoto(kind: 'avatar' | 'cover'): Promise<boolean> {
  const shape = SHAPE[kind];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: shape.aspect,
    quality: 0.85,
  });
  const asset = res.canceled ? null : res.assets[0];
  if (!asset) return false;
  await uploadForm(shape.path, () => {
    const body = new FormData();
    body.append('file', {
      uri: asset.uri,
      name: asset.fileName ?? shape.name,
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
    return body;
  });
  return true;
}
