import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '@/api/client';

import { appVersion, getInstallationId } from './device';

/**
 * Ask for notification permission and register this installation's Expo push token.
 * Safe to call on every launch: the backend registration is idempotent.
 * Needs a development build (not Expo Go) and an EAS projectId in app.json.
 */
export async function registerForPush(): Promise<boolean> {
  if (!Device.isDevice || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return false;

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return false;

  const projectId = (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) || undefined;
  if (!projectId) return false;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const res = await api.PUT('/api/v1/auth/push-devices/', {
    body: {
      installation_id: await getInstallationId(),
      token,
      platform: Platform.OS,
      app_version: appVersion,
      locale: Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 20),
    },
  });
  return res.response.ok;
}

export async function unregisterPushDevice(): Promise<void> {
  const installationId = await getInstallationId();
  await api.DELETE('/api/v1/auth/push-devices/{installation_id}/', {
    params: { path: { installation_id: installationId } },
  });
}
