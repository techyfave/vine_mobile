import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const INSTALLATION_KEY = 'vine.installation_id';

export type ClientPlatform = 'ios' | 'android' | 'web' | 'other';

export const platform: ClientPlatform =
  Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'other';

export const appVersion: string = Application.nativeApplicationVersion ?? '0.0.0';

export const deviceName: string = (Device.deviceName ?? Device.modelName ?? '').slice(0, 100);

let cachedInstallationId: string | null = null;

/** Stable random ID for this install. Not a hardware identifier; reset on reinstall. */
export async function getInstallationId(): Promise<string> {
  if (cachedInstallationId) return cachedInstallationId;
  let id = await SecureStore.getItemAsync(INSTALLATION_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(INSTALLATION_KEY, id);
  }
  cachedInstallationId = id;
  return id;
}

export async function deviceInfo() {
  return {
    platform,
    device_name: deviceName,
    app_version: appVersion,
    installation_id: await getInstallationId(),
  };
}
