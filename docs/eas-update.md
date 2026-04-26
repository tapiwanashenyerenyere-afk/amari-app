# EAS Update

AMARI Mobile uses EAS Update to ship JavaScript, styling, and asset-only fixes without producing a new App Store IPA or Play Store AAB.

## One-time native baseline

The app must be installed from a native build that already includes `expo-updates`. Builds created before this setup cannot receive OTA updates.

After this PR is merged, ship one new production build to TestFlight and Play internal testing:

```powershell
npm run release:ios
npm run release:android
```

After testers install that baseline build, OTA-safe changes can be published without a new AAB/IPA.

## Publish updates

Preview:

```powershell
npm run update:preview -- --message "Describe the preview update"
```

Production:

```powershell
npm run update:production -- --message "Describe the production update"
```

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
