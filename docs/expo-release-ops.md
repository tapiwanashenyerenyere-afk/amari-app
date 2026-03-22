# Expo Release Operations

## What is wired now

- `EAS Build` GitHub workflow for Android preview and production builds
- `EAS Update` GitHub workflow for OTA JavaScript and asset releases
- `EAS Submit` GitHub workflow for Google Play submission once the Play service account secret is present
- EAS Update channels in `eas.json`
- `runtimeVersion` and `updates.url` in `app.config.js`

## Required GitHub secrets

- `EXPO_TOKEN`
- `ANDROID_KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`

## Channels

- `preview`: internal QA builds and test updates
- `production`: store builds and member-facing OTA updates

## OTA updates

Use OTA only for JavaScript and asset changes. Do not use OTA for changes that require a new native binary, such as:

- adding or removing native Expo modules
- SDK upgrades
- changes to app permissions or native config

## Expo MCP and AI tooling

The repo now includes the official `expo-mcp` dev dependency so Claude Code or Codex can use Expo's local MCP tooling for visual verification.

PowerShell example:

```powershell
$env:EXPO_UNSTABLE_MCP_SERVER='1'
npx expo start
```

Recommended companion tooling from Expo's official docs:

- Expo MCP for build, workflow, and local UI verification
- Expo Skills for deployment, upgrades, and native UI work

Useful next prompts once the local MCP server is running:

- "Open the Pulse screen, take a screenshot, and verify the carousel, editorial block, and event dates."
- "Tap through the Aligned projects and interests routes and verify the empty states are truthful."
- "Check the membership card overlay on Profile and Corridor and confirm layout on a narrow Android viewport."

## Play submission secret

The submit workflow expects the Google Play service account JSON to be base64-encoded into the `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64` GitHub secret.

PowerShell example:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\google-service-account.json"))
```

## Claude Code handoff

Use this prompt with Claude Code:

```text
We have already finished the Android production build for AMARI. The remaining blocker is Google Play submission.

Please do one of the following for package `com.amari.mobile`:

1. Obtain the Google Play service-account JSON that has permission to release this app on Google Play, then base64-encode it and update the GitHub repo secret:
   - Repo: tapiwanashenyerenyere-afk/amari-app
   - Secret name: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64

OR

2. If you only have Expo/EAS dashboard access, upload the Google Play service-account JSON into Expo/EAS Android submit credentials for this project and tell me when it is attached to the correct app. The repo is currently wired for the GitHub secret path, so I will make the small follow-up config change after you confirm the dashboard credential is in place.

Important context:
- Expo account: `t.jeremy.n`
- Expo project: `amari-mobile`
- Android package: `com.amari.mobile`
- The repo already has `eas-submit.yml` and `eas.json` wired for submit.
- The successful production build can be submitted with the `internal` or `production` submit profile.

After that, either:
- run the GitHub Actions workflow `EAS Submit`, or
- tell me the credential is in place so I can trigger the submit myself.
```

## Current limitation

Bundle diffing for EAS Update is not enabled because Expo documents it as SDK 55+ only, and this app is currently on SDK 54.
