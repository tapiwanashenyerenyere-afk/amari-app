# App Store Submission Runbook

Current target: AMARI iOS `1.1.0`, build `11`.

App Store Connect app ID: `6762464403`

EAS build ID: `6d3cb52d-6523-4fdf-8962-02a9e4d2b706`

Git commit: `9550d2ced2e9037cc94a27e153aee42f620d87c0`

## Current State

- The production iOS binary has been built by EAS and uploaded through EAS Submit.
- The real App Store submission must now be completed in App Store Connect.
- `store.config.json` contains a safe first-pass Apple metadata draft for version `1.1.0`.
- EAS Metadata is beta and currently supports Apple metadata, but the final build selection and App Review submission still need App Store Connect access.

## Manual App Store Connect Steps

1. Open `https://appstoreconnect.apple.com/apps/6762464403/appstore`.
2. Select the iOS app version for `1.1.0`, or create it if App Store Connect has not created it yet.
3. In the Build section, select build `11` from the uploaded builds.
4. Confirm export compliance. The app config sets `ITSAppUsesNonExemptEncryption` to `false`.
5. Add required screenshots for the iPhone display sizes Apple requests.
6. Confirm the privacy policy URL is `https://www.amarigroupau.com/privacy-policy`.
7. Complete App Privacy answers so they match the AMARI privacy policy and actual app behavior.
8. Add App Review contact details and a valid reviewer login.
9. Add for Review, then submit the draft submission for App Review.

## Reviewer Access

Apple needs a working account because AMARI is invite-only. Use a dedicated reviewer account, not a personal admin account.

Reviewer username: `appreview@amarigroupau.com`

Do not commit the password. Store the current App Review password only in App
Store Connect's Beta App Review Information / App Review Information fields.

The app supports this reviewer path:

1. Open the app.
2. Tap the existing member or reviewer sign-in path.
3. Sign in with the supplied review email and password.
4. Verify the member account is active and can reach representative content.

Do not put reviewer credentials in GitHub. Store them only in App Store Connect review credentials.

## Pre-Submission Checks

- `npm run verify:release` passes.
- Latest iOS build in App Store Connect is `1.1.0 (11)`.
- Email/password reviewer login works on a real iOS device or TestFlight build.
- Google sign-in is not the only available sign-in path.
- Sign in with Apple is enabled in Apple Developer capabilities and visible on iOS.
- Magic link and OTP fallback work.
- Privacy policy and delete-account links are reachable from the app.
- Mapbox map renders and country borders are visible where expected.

## References

- Apple choose-build flow: https://developer.apple.com/help/app-store-connect/manage-builds/choose-a-build-to-submit
- Apple submit-for-review flow: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app
- Expo EAS Metadata: https://docs.expo.dev/eas/metadata/getting-started/
