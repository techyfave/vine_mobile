# Preview Vine on your Android phone

## What caused the development-server screen

The original APK (build `62bd1d67-ba70-42ff-ba6c-e54d271190f1`) used the
`development` profile. It needs Metro running on your computer. This is expected
behavior, not an APK installation failure.

The project is linked to **@techyfave/vine**, ID
`fd9a9e85-60cd-41e0-9213-63ff969e7087`. The separate
`techyfaves-team/vine` dashboard showed no builds when checked.

## Use the development APK you already installed

1. Connect your phone and computer to the same Wi-Fi.
2. Open PowerShell and run:

   ```powershell
   cd C:\Users\Favour\vine\vine_mobile
   npm run start:dev
   ```

3. Keep that terminal running. Open the installed **Vine** app and scan the
   terminal's development QR code, or enter `http://YOUR_COMPUTER_WIFI_IP:8081`
   in its development-server field. Use the port printed by Expo if different.
4. Run `ipconfig` to find the IPv4 address under your active Wi-Fi adapter.
   During troubleshooting it was `172.20.3.96`; this can change.
5. If this project's Expo server already occupies port 8081, use that server.

If LAN access fails (for example, Wi-Fi client isolation), try:

```powershell
npm run start:dev -- --tunnel
```

Accept Expo's official tunnel dependency installation if prompted. Use the new
QR code/URL. The tunnel exposes Metro while it runs; it does **not** tunnel your
Django API. Stop it with Ctrl+C when finished.

## Build a standalone preview APK

```powershell
cd C:\Users\Favour\vine\vine_mobile
npm install
npx eas-cli@latest whoami
# Only if you are not signed in:
npx eas-cli@latest login
npx eas-cli@latest project:info
npx eas-cli@latest build --platform android --profile preview
```

1. Confirm `project:info` reports `@techyfave/vine`.
2. Wait for completion. Open the build link printed in the terminal, or
   https://expo.dev/accounts/techyfave/projects/vine/builds.
3. Select the **preview** build, choose **Install**, and open its link on your
   Android phone. Download the APK and allow your browser to install it if asked.
4. Install the update and open **Vine** from your launcher. This APK does not
   need Expo Go or a running computer.

The preview profile explicitly sets `developmentClient: false`, internal
distribution, the `preview` EAS environment, and Android `buildType: apk`.

## Expo Go

```powershell
npm run start:go
```

Scan that QR code using Expo Go on Android. Expo Go must support this project's
SDK 57. Remote push notifications and some native authentication functionality
need a development/standalone build. Expo Go keeps its own launcher icon.

## Vine launcher icon

`app.json` uses `assets/images/logo-mark.png` for the app icon and Android
adaptive foreground, with background `#E1ECFA`. Starter foreground, background,
and monochrome icon references were removed.

Changing the launcher icon requires a **new build and APK installation**.
Reloading JavaScript cannot update an already-installed icon.

## Backend connectivity

No hosted API URL was supplied. The default `http://localhost:8000` points to
the phone itself. The UI can open without a backend, but login, registration and
live content need a reachable API.

For a hosted backend, set `EXPO_PUBLIC_API_URL` to its HTTPS origin in the
project's **EAS preview environment**, then rebuild the APK. This is a public
build-time value: never put secrets in `EXPO_PUBLIC_*` variables.

For local development, first set up Django's database/cache and dependencies
using `../vine_api/README.md`. Run Django on `0.0.0.0:8000`, add the computer's
Wi-Fi IP to Django's `ALLOWED_HOSTS`, and start Expo with:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://YOUR_COMPUTER_WIFI_IP:8000'
npm run start:dev -- --clear
```

The phone must reach that address. Android builds can restrict plain HTTP;
prefer HTTPS for a standalone preview. Do not disable the firewall globally.
Keep the API/database/cache running.

## Checks before another build

```powershell
npm run typecheck
npx expo lint
npx expo-doctor
npx expo export --platform android --output-dir .expo/preview-check
```

Reference: https://docs.expo.dev/build-reference/apk/

## Verification performed on 3 October 2026

- Confirmed the CLI project ID matches the existing personal-account build.
- Confirmed the existing Metro server serves Vine on port 8081, including its
  Wi-Fi address `172.20.3.96`.
- TypeScript passed and Expo Doctor passed all 21 checks.
- Android export passed (1,516 modules, 79 assets).
- Added Expo's standard ESLint configuration because the project had none.
  Lint reported an existing `react-hooks/set-state-in-effect` error in
  `src/app/(app)/create-post.tsx:33` and an unused disable comment in
  `src/ui/assets.ts:1`. These do not prevent bundling; they were not changed as
  part of preview configuration.
- Reused the existing Android keystore for the new preview build.
- Submitted preview build `d371665d-2c90-4c5f-9dff-03ca7a23c57a`:
  https://expo.dev/accounts/techyfave/projects/vine/builds/d371665d-2c90-4c5f-9dff-03ca7a23c57a
  Open that page to check its current status before downloading.
