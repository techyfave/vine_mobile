import * as SecureStore from 'expo-secure-store';

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
    SecureStore.setItemAsync(ACCESS_KEY, tokens.access, options),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh, options),
  ]);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY, options),
    SecureStore.getItemAsync(REFRESH_KEY, options),
  ]);
  if (!refresh) return null;
  accessToken = access;
  return { access: access ?? '', refresh };
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY, options);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY, options),
    SecureStore.deleteItemAsync(REFRESH_KEY, options),
  ]);
}
