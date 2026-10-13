/**
 * Crash and error reporting (Sentry).
 *
 * Off in development and when no DSN is configured (app.json `extra.sentryDsn`, or
 * EXPO_PUBLIC_SENTRY_DSN). No personal data is sent: users are identified by their ID only.
 */
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn =
  process.env.EXPO_PUBLIC_SENTRY_DSN || (Constants.expoConfig?.extra?.sentryDsn as string | undefined) || '';

export const sentryEnabled = Boolean(dsn) && !__DEV__;

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'staging',
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}

export function identify(userId: string | null) {
  if (sentryEnabled) Sentry.setUser(userId ? { id: userId } : null);
}

export function report(error: unknown) {
  if (sentryEnabled) Sentry.captureException(error);
}

export { Sentry };
