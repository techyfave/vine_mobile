# Vine mobile

Expo (React Native) app for Vine — iOS and Android. The first Vine client (see the roadmap, §1A).

## Preview on an Android phone

See [PHONE_PREVIEW.md](PHONE_PREVIEW.md) for Windows commands, APK installation,
the Vine launcher icon, and backend connectivity troubleshooting.

## Run it

```bash
npm install
# API on your computer: use its LAN IP, not localhost, when testing on a phone
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000 npx expo start
```

Push notifications need a development build (`npx expo run:ios|android` or `eas build --profile development`) and an EAS project ID in `app.json` → `extra.eas.projectId`. Expo Go is fine for everything else.

## Design

Screens follow the Figma file (VINE → MOBILE page, plus DESKTOP screens adapted to mobile). Colours, fonts and
assets come from the same source as the web app (`vineplatform`): navy `#264A74`, Roboto + Montez, the Vine
logos and icons. Tokens live in `src/ui/theme.ts`; shared components in `src/ui/`.

## Sign in with Apple / Google

- **Apple:** works on iOS dev/production builds (`ios.usesAppleSignIn` is on). Add the bundle ID to the backend's
  `APPLE_CLIENT_IDS`.
- **Google:** create iOS and Android OAuth client IDs in Google Cloud, put them in `app.json` →
  `extra.googleClientIds`, and add the same IDs to the backend's `GOOGLE_CLIENT_IDS`. The Google button stays
  hidden until a client ID exists for the platform.

## Checks

```bash
npm run typecheck
```

## API types

`src/api/schema.d.ts` is generated from the backend's OpenAPI contract. After backend API changes:

```bash
# in vine_api
DJANGO_SETTINGS_MODULE=config.settings.test API_DOCS_ENABLED=true \
  python manage.py export_openapi_schema --api api.v1.router.api --output ../vine_mobile/openapi/openapi.json --indent 2
# in vine_mobile
npm run gen:api && npm run typecheck
```

Typecheck failures after regenerating mean the API changed shape. Fix the app, or make the backend change additive.

## How it's put together

```
src/app/            screens (Expo Router; files = routes)
  _layout.tsx       providers + auth gate (Stack.Protected)
  sign-in, sign-up, forgot-password, reset-password
  (app)/            signed-in area: verify-email gate, home feed, settings
src/api/            generated schema, typed client, token storage, errors
src/auth/           AuthProvider (session restore, sign in/up/out)
src/lib/            device info, push registration
src/ui/             theme + basic components
```

Security rules for the app:

- Tokens are stored only in the OS keychain/keystore (`expo-secure-store`), never AsyncStorage, logs or analytics.
- Token refresh is single-flight. The backend treats reuse of an old refresh token as theft and signs the device out.
- The query cache is cleared on sign-out, so one account's data never shows for the next.
- Every request sends `X-Client-Platform` / `X-Client-Version`. If the backend answers 426, the app shows the update screen.
