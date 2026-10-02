import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Keychain/Keystore on iOS/Android. On web (used only for local previews) values live in
 * memory and are never persisted — tokens must not go into localStorage.
 */
const memory = new Map<string, string>();
const isWeb = Platform.OS === 'web';

export const secureStorage = {
  get: (key: string, options?: SecureStore.SecureStoreOptions): Promise<string | null> =>
    isWeb ? Promise.resolve(memory.get(key) ?? null) : SecureStore.getItemAsync(key, options),
  set: async (key: string, value: string, options?: SecureStore.SecureStoreOptions): Promise<void> => {
    if (isWeb) memory.set(key, value);
    else await SecureStore.setItemAsync(key, value, options);
  },
  remove: async (key: string, options?: SecureStore.SecureStoreOptions): Promise<void> => {
    if (isWeb) memory.delete(key);
    else await SecureStore.deleteItemAsync(key, options);
  },
};
