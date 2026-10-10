import Constants from 'expo-constants';

/**
 * API base URL, in order of preference:
 * 1. EXPO_PUBLIC_API_URL (set per environment, e.g. in EAS env vars for preview/production builds).
 * 2. In development: the same computer that serves the app (Metro), on port 8000. A phone on the
 *    same Wi-Fi then reaches the local API with no setup, because "localhost" on a phone is the phone.
 * 3. app.json `extra.apiUrl`.
 */
function devServerApiUrl(): string | undefined {
  if (!__DEV__) return undefined;
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.20:8081"
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:8000` : undefined;
}

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  devServerApiUrl() ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  'http://localhost:8000';
