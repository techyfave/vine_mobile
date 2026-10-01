import Constants from 'expo-constants';

/**
 * API base URL. Set EXPO_PUBLIC_API_URL per environment (e.g. in .env or EAS env vars);
 * falls back to app.json `extra.apiUrl` for local development.
 * On a physical phone, "localhost" is the phone itself — use your computer's LAN IP.
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:8000';
