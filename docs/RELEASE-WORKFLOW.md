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

## Required Environment Variables

Local `.env` and the EAS production environment must include:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MAPBOX_TOKEN`
- `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

Optional:

- `EXPO_PUBLIC_MAPBOX_STYLE_URL`

## Final Checklist

- `npm run verify:release` passes
- dev client signs in correctly
- Aligned renders a live Mapbox basemap
- Australia remains state-level only
- Events, Pulse, and membership-card gating match server behavior
- email/share/open-external actions work on device
- release build is run from `C:\amari-mobile-release`
- generated AAB is smoke-tested before manual upload
