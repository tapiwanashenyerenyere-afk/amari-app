# EAS Update

> **OTA publishing is currently BLOCKED. Ship via store builds instead.**
> The app config requires code-signed updates, and Expo requires an EAS
> **Enterprise** subscription to publish those. The `t.jeremy.n` account is on
> **Starter**. Every production change since April has shipped as an App Store /
> Play build, not an OTA update. See `docs/RELEASE-WORKFLOW.md` for the path that
> actually works. The rest of this document describes the OTA setup as designed,
> for when the plan changes. Do not bypass the block by publishing unsigned
> updates.

EAS Update is configured to ship JavaScript, styling, and asset-only fixes without producing a new App Store IPA or Play Store AAB.

## One-time native baseline

The app must be installed from a native build that already includes `expo-updates`. Builds created before this setup cannot receive OTA updates.

After this PR is merged, ship one new production build to TestFlight and Play closed testing/Alpha:

```powershell
npm run release:ios
npm run release:android
```

After testers install that baseline build, OTA-safe changes can be published without a new AAB/IPA.

## Publish updates

Preview:

```powershell
npm run update:preview:ios -- --message "Describe the preview update"
npm run update:preview:android -- --message "Describe the preview update"
```

Production:

```powershell
npm run update:production:ios -- --message "Describe the production update"
npm run update:production:android -- --message "Describe the production update"
```

Production update scripts intentionally fail closed until EAS Update code
signing is configured in `app.json` with:

- `expo.updates.codeSigningCertificate`
- `expo.updates.codeSigningMetadata.keyid`
- `expo.updates.codeSigningMetadata.alg`

This is enforced by `scripts/guard-production-update.mjs` and by
`npm run verify:release`.

Production publishing also requires the matching private key at
`certs/private-key.pem` on the release machine, or a path supplied through
`EAS_UPDATE_PRIVATE_KEY_PATH`. This private key must not be committed.

As of 2026-04-29, Expo also requires an EAS Enterprise subscription to publish
code-signed updates. The `t.jeremy.n` account was on Starter, so signed
production OTA publishing failed with:

```text
EAS Update code signing requires a subscription to the EAS Enterprise plan.
```

Do not bypass this by publishing unsigned production updates. Until AMARI
upgrades to Enterprise or changes the update-signing policy, ship production
changes through App Store/TestFlight and Play AAB builds.

If the signing certificate is rotated, ship a new native build with a new app
version/runtime version before publishing updates signed by the new key.

Publish mobile updates by explicit platform. This app is mobile-first and uses RNMapbox; `eas update --platform all` also tries to export web and can fail on Mapbox web dependencies that are not part of the native app runtime.

The build profiles are mapped to matching EAS Update channels:

| Build profile | EAS environment | Update channel |
| --- | --- | --- |
| `development` | `development` | `development` |
| `preview` | `preview` | `preview` |
| `production` | `production` | `production` |

## OTA-safe changes

Use EAS Update for:

- React Native screen logic, copy, styles, and layout changes.
- Map layer styling or data rendering changes that do not add native dependencies.
- Static assets that are bundled by Expo.

Create a new native build for:

- New or changed native dependencies.
- Changes to `app.json` native config, permissions, app icons, splash screen, URL schemes, entitlements, bundle IDs, or package names.
- Expo SDK or React Native upgrades.
- Anything that changes `runtimeVersion` compatibility.

## Environment variables

`EXPO_PUBLIC_*` values used by the JavaScript bundle must be readable by `eas update`, so they are configured in EAS as `sensitive` variables for development, preview, and production.

`RNMAPBOX_MAPS_DOWNLOAD_TOKEN` remains `secret` because it is only needed by native builds.

Verify EAS variables without printing values:

```powershell
npx eas env:list --environment production
```

Run the release verifier before a native release:

```powershell
npm run verify:release
```
