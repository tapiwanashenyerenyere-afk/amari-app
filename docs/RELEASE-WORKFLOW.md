# AMARI Release Workflow

This is the production release path for the AMARI mobile app.

## Principles

- Use the native dev client for development and QA.
- Use EAS for all Android release builds.
- Run release builds from `C:\amari-mobile-release`, not directly from OneDrive.
- Keep native Mapbox download auth in environment variables, not committed source.

## Daily Development

Use the native client instead of Expo Go:

```bash
npm run start:dev
```

For a clean Metro session:

```bash
npm run start:dev:clear
```

To launch Android through the dev client:

```bash
npm run android:dev
```

## Release Verification

Before every release:

```bash
npm run verify:release
```

This runs:

- full ESLint
- full TypeScript check
- Expo config validation

The repo also runs this automatically on `git push`.

## Clean Release Copy

Prepare a clean copy outside OneDrive before EAS builds:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-release-copy.ps1
```

Then switch to:

```text
C:\amari-mobile-release
```

From that clean path:

```bash
npm ci
npm run verify:release
```

## Production Android Build

From `C:\amari-mobile-release`:

```bash
npm run release:android
```

Do not submit this local EAS production Android build to Google Play unless EAS
remote Android credentials have first been verified against Play Console's upload
certificate. On 2026-04-27, a local EAS production build used the wrong remote
upload key and Play rejected it with:

- found SHA1: `37:21:FB:C3:25:7D:C8:C0:8E:BE:8E:CA:79:2F:4E:8D:2B:1A:BA:6A`
- expected SHA1: `C4:CD:C3:BA:73:2E:42:07:2D:D0:5E:2B:0F:2D:C2:9A:74:6F:31:4B`

Until EAS remote Android credentials are replaced with the same upload key used
by Play, Play-bound production Android builds must use the GitHub Actions
workflow below.

## Play-Bound Android Build

The GitHub Actions workflow `.github/workflows/eas-build.yml` injects the
correct Play upload keystore for production builds:

- `ANDROID_KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- keystore alias: `amari-key`
- generated local keystore path during CI: `amari-upload.jks`

Trigger the workflow from the release branch:

```bash
gh workflow run eas-build.yml --ref release/v2-redesign-signed -f profile=production
```

Watch it:

```bash
gh run list --workflow eas-build.yml --limit 5
gh run watch <run-id> --exit-status
```

Find the resulting EAS Android build ID:

```bash
npx eas build:list --platform android --limit 5 --json
```

Submit that exact build ID to Google Play internal testing from
`C:\amari-mobile-release`:

```bash
npx eas submit --platform android --profile production --id <android-build-id> --non-interactive --wait
```

The service-account JSON must exist locally at
`C:\amari-mobile-release\google-services.json`, matching the
`submit.production.android.serviceAccountKeyPath` entry in `eas.json`. Do not
commit this file. It is ignored by `.gitignore` and excluded from EAS upload by
`.easignore`.

## 2026-04-27 Android Submit Notes

Automated Play upload was fixed by separating two problems:

1. The Google Play service account was valid. The JSON key was saved outside the
   repo, copied locally to `C:\amari-mobile-release\google-services.json`, and
   EAS Submit reached Google Play successfully.
2. The failing AAB was signed with the wrong upload key. Play rejected Android
   build `f52e39f3-86fb-4f3a-b4e5-aa1d211b2f6f`, versionCode `38`.
3. The repo workflow revealed the intended signing path: production Android CI
   builds use `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, alias `amari-key`,
   and local EAS credentials.
4. Running the GitHub Actions production workflow produced Android build
   `75ec1c15-b67b-4577-ae50-7e15838e2683`, version `1.1.0`, versionCode `39`.
5. EAS Submit accepted that build to the Play internal track:
   `https://expo.dev/accounts/t.jeremy.n/projects/amari-mobile/submissions/a2390daa-a7d5-4093-8534-a90c496ef6a6`

If a future build is rejected for upload-key mismatch, check Play Console >
Release > Setup > App integrity and compare the upload certificate SHA1 with the
keystore used by the build. Either rebuild with the expected upload key or reset
the Play upload key to the EAS key.

## Required Environment Variables

Local `.env` and the EAS production environment must include:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AUTH_REDIRECT_URL=https://www.amarigroupau.com/auth-callback`
- `EXPO_PUBLIC_MAPBOX_TOKEN`
- `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

Optional:

- `EXPO_PUBLIC_MAPBOX_STYLE_URL`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`

## App Review Access

Before submitting a TestFlight or App Store build, App Store Connect must include Beta App Review credentials for a real Supabase user. The app supports this through the auth screen path:

1. Tap "Already a member?" / "Reviewer or existing member sign in".
2. Enter the demo account email and password supplied in App Store Connect.
3. Confirm the account is an active member with representative tier access and sample content.

The Supabase hosted Auth settings must also have:

- Site URL: `https://www.amarigroupau.com/auth-callback`
- Redirect URL: `amari://auth-callback`
- Redirect URL: `https://www.amarigroupau.com/auth-callback`
- Google provider enabled for Android/Web, with iOS native client optional because the app falls back to OAuth if `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` is absent.
- Apple provider enabled before iOS release review if Google login remains visible on iOS.

## App Store Submission

Use `docs/APP-STORE-SUBMISSION.md` for the real App Store submission runbook.
The repo also tracks Apple metadata in `store.config.json`, which can be
validated with:

```bash
npx eas metadata:lint
```

EAS Metadata is beta and supports Apple metadata only. Final build selection,
review credentials, screenshots, App Privacy answers, and the "Submit for
Review" action still need App Store Connect access.

## Final Checklist

- `npm run verify:release` passes
- Supabase Auth Site URL is not `localhost`
- TestFlight reviewer account signs in with email/password
- Google sign-in works or falls back to browser OAuth on iOS
- Sign in with Apple works on a physical iOS device
- email magic link opens AMARI or the OTP code fallback signs in
- Profile > Account includes Privacy Policy and Delete Account request
- dev client signs in correctly
- Aligned renders a live Mapbox basemap
- Australia remains state-level only
- Events, Pulse, and membership-card gating match server behavior
- email/share/open-external actions work on device
- release build is run from `C:\amari-mobile-release`
- Play-bound Android production build is created through the GitHub Actions workflow or otherwise verified against Play's upload certificate
- generated AAB is smoke-tested before upload
