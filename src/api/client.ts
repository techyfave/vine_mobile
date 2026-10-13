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
import { ApiError, type ApiErrorBody } from './errors';
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

/** Rebuild as a standard Response so openapi-fetch accepts it as a replacement. */
async function toResponse(res: Response): Promise<Response> {
  if ((res as unknown) instanceof Response) return res; // TS narrows Response to never otherwise
  const body = [204, 205, 304].includes(res.status) ? null : await res.text();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

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
    // Return nothing unless the response is replaced. openapi-fetch rejects anything that is not
    // `instanceof Response`, and the response objects from Expo's fetch are a different class.
    if (response.status === 426) {
      updateRequiredListeners.forEach((fn) => fn());
      return undefined;
    }
    if (response.status !== 401 || !original) return undefined;
    const newToken = await refreshAccessToken();
    if (!newToken) return undefined;
    const retry = new Request(original, { headers: new Headers(original.headers) });
    retry.headers.set('Authorization', `Bearer ${newToken}`);
    return toResponse(await fetch(retry));
  },
  onError({ id }) {
    pendingRetries.delete(id);
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(authMiddleware);

/**
 * Multipart upload (images), with the same auth headers and refresh-and-retry-once behaviour as `api`.
 *
 * Sent with XMLHttpRequest, not fetch: Expo's fetch only accepts Blob/File parts in FormData and
 * rejects React Native's `{ uri, name, type }` file parts ("Unsupported FormDataPart
 * implementation"). React Native's XMLHttpRequest streams those file URIs natively.
 */
export async function uploadForm(
  path: string,
  build: () => FormData,
  opts: { onProgress?: (fraction: number) => void } = {},
): Promise<unknown> {
  let res = await sendMultipart(`${API_URL}${path}`, build(), getAccessToken(), opts.onProgress);
  if (res.status === 401) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await sendMultipart(`${API_URL}${path}`, build(), fresh, opts.onProgress);
  }
  if (res.status === 426) updateRequiredListeners.forEach((fn) => fn());
  if (res.status < 200 || res.status >= 300) throw new ApiError(res.status, res.body as ApiErrorBody);
  return res.body;
}

function sendMultipart(
  url: string,
  body: FormData,
  token: string | null,
  onProgress?: (fraction: number) => void,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    for (const [k, v] of Object.entries(clientHeaders())) xhr.setRequestHeader(k, v);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 180_000; // several photos on slow networks
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      let parsed: unknown = {};
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        // non-JSON error page; keep {}
      }
      resolve({ status: xhr.status, body: parsed });
    };
    // Same message as fetch's, so errorMessage() shows "Can't reach Vine".
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.ontimeout = () => reject(new TypeError('Network request failed (timed out)'));
    xhr.send(body);
  });
}
