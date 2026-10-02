import * as SecureStore from 'expo-secure-store';

import { secureStorage } from '@/lib/secureStorage';

/**
 * Tokens live only in the OS keychain/keystore (never AsyncStorage, logs or analytics).
 * The access token is also kept in memory to avoid a keychain read on every request.
 */
const REFRESH_KEY = 'vine.refresh_token';
const ACCESS_KEY = 'vine.access_token';

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

let accessToken: string | null = null;

export type StoredTokens = { access: string; refresh: string };

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  accessToken = tokens.access;
  await Promise.all([
    secureStorage.set(ACCESS_KEY, tokens.access, options),
    secureStorage.set(REFRESH_KEY, tokens.refresh, options),
  ]);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [access, refresh] = await Promise.all([
    secureStorage.get(ACCESS_KEY, options),
    secureStorage.get(REFRESH_KEY, options),
  ]);
  if (!refresh) return null;
  accessToken = access;
  return { access: access ?? '', refresh };
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  return secureStorage.get(REFRESH_KEY, options);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await Promise.all([
    secureStorage.remove(ACCESS_KEY, options),
    secureStorage.remove(REFRESH_KEY, options),
  ]);
}
