/**
 * Typed API client generated from the backend's OpenAPI contract (src/api/schema.d.ts).
 *
 * - Attaches the access token and client version headers to every request.
 * - On 401, refreshes once and retries. Refreshes are single-flight: concurrent 401s share
 *   one refresh call, because the backend treats reuse of an old refresh token as theft.
 * - On 426 (app too old), notifies the app so it can show the update screen.
 * - If refreshing fails, tokens are cleared and the app returns to sign-in.
 */
import createClient, { type Middleware } from 'openapi-fetch';

import { API_URL } from '@/config';
import { appVersion, platform } from '@/lib/device';

import type { components, paths } from './schema';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokens';

export type Schemas = components['schemas'];

type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();
const updateRequiredListeners = new Set<Listener>();

export function onSessionExpired(fn: Listener) {
  sessionExpiredListeners.add(fn);
  return () => {
    sessionExpiredListeners.delete(fn);
  };
}

export function onUpdateRequired(fn: Listener) {
  updateRequiredListeners.add(fn);
  return () => {
    updateRequiredListeners.delete(fn);
  };
}

const NO_AUTH_PATHS = ['/api/v1/auth/login/', '/api/v1/auth/register/', '/api/v1/auth/refresh/'];

let refreshInFlight: Promise<string | null> | null = null;

/** Exchange the stored refresh token for a new pair. Returns the new access token or null. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refresh = await getRefreshToken();
      if (!refresh) return null;
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...clientHeaders() },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) {
          if (res.status === 401) {
            await clearTokens();
            sessionExpiredListeners.forEach((fn) => fn());
          }
          return null;
        }
        const body = (await res.json()) as Schemas['TokenSchema'];
        await saveTokens({ access: body.access, refresh: body.refresh });
        return body.access;
      } catch {
        return null; // offline: keep tokens, try again later
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function clientHeaders(): Record<string, string> {
  return platform === 'ios' || platform === 'android'
    ? { 'X-Client-Platform': platform, 'X-Client-Version': appVersion }
    : {};
}

const pendingRetries = new Map<string, Request>();

const authMiddleware: Middleware = {
  async onRequest({ request, id, schemaPath }) {
    for (const [k, v] of Object.entries(clientHeaders())) request.headers.set(k, v);
    const token = getAccessToken();
    if (token && !NO_AUTH_PATHS.includes(schemaPath)) {
      request.headers.set('Authorization', `Bearer ${token}`);
      pendingRetries.set(id, request.clone()); // body can only be read once; keep a copy for a retry
    }
    return request;
  },
  async onResponse({ response, id }) {
    const original = pendingRetries.get(id);
    pendingRetries.delete(id);
    if (response.status === 426) {
      updateRequiredListeners.forEach((fn) => fn());
      return response;
    }
    if (response.status !== 401 || !original) return response;
    const newToken = await refreshAccessToken();
    if (!newToken) return response;
    const retry = new Request(original, { headers: new Headers(original.headers) });
    retry.headers.set('Authorization', `Bearer ${newToken}`);
    return fetch(retry);
  },
  onError({ id }) {
    pendingRetries.delete(id);
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(authMiddleware);
