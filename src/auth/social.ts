/**
 * Sign in with Apple / Google on the device. Both produce an ID token that the backend
 * verifies itself (POST /auth/social/); the app never decides who the user is.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export type SocialCredential = {
  provider: 'apple' | 'google';
  id_token: string;
  nonce?: string;
  first_name?: string;
  last_name?: string;
};

export class SocialCancelled extends Error {}

type GoogleIds = { ios?: string; android?: string; web?: string };
const googleIds = (Constants.expoConfig?.extra?.googleClientIds ?? {}) as GoogleIds;

/** True only when this platform has a Google client ID. expo-auth-session throws without one,
 * so the Google button (and its hook) must not render unless this is true. */
export const googleConfigured = Boolean(
  Platform.OS === 'ios' ? googleIds.ios : Platform.OS === 'android' ? googleIds.android : googleIds.web,
);

export async function appleAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

export async function signInWithApple(): Promise<SocialCredential> {
  // Apple embeds sha256(nonce) in the token; the backend checks it against the raw nonce.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!cred.identityToken) throw new Error('Apple did not return an identity token');
    return {
      provider: 'apple',
      id_token: cred.identityToken,
      nonce: rawNonce,
      // Apple only shares the name on the very first sign-in.
      first_name: cred.fullName?.givenName ?? '',
      last_name: cred.fullName?.familyName ?? '',
    };
  } catch (err) {
    if ((err as { code?: string }).code === 'ERR_REQUEST_CANCELED') throw new SocialCancelled();
    throw err;
  }
}

/** Google sign-in as a hook (expo-auth-session needs a request object prepared ahead of the tap). */
export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: googleIds.ios || undefined,
    androidClientId: googleIds.android || undefined,
    webClientId: googleIds.web || undefined,
  });
  const pending = useRef<{ resolve: (c: SocialCredential) => void; reject: (e: Error) => void } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!response || !pending.current) return;
    const { resolve, reject } = pending.current;
    pending.current = null;
    setBusy(false);
    if (response.type === 'success' && typeof response.params.id_token === 'string') {
      resolve({ provider: 'google', id_token: response.params.id_token });
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      reject(new SocialCancelled());
    } else {
      reject(new Error('Google sign-in failed'));
    }
  }, [response]);

  const signIn = useCallback(() => {
    return new Promise<SocialCredential>((resolve, reject) => {
      if (!request || !googleConfigured) {
        reject(new Error('Google sign-in is not set up yet'));
        return;
      }
      pending.current = { resolve, reject };
      setBusy(true);
      promptAsync().catch((err: Error) => {
        pending.current = null;
        setBusy(false);
        reject(err);
      });
    });
  }, [promptAsync, request]);

  return { signIn, busy, ready: Boolean(request) && googleConfigured };
}
