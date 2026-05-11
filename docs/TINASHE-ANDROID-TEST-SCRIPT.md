# AMARI Android Test Script for Tinashe

Use this script for Tinashe on Android. Do not send him TestFlight or Apple App
Store tester instructions.

## Tester Account

- Platform: Android through Google Play Alpha/closed testing
- AMARI login email: `tinashemapindu@yahoo.com.au`
- Google Play tester account: use `tinashemapindu@yahoo.com.au` only if that is
  the Google account on his Android phone. If Play Store uses a different Gmail
  or Google Workspace account, add that Google account to the tester list and
  still use `tinashemapindu@yahoo.com.au` inside AMARI.
- AMARI invite code: `AMARI-SLVR-A3B44BDA`
- Auth method: email one-time code

## Play Console Setup

1. Add Tinashe's Android Play Store Google account to the Google Play
   Alpha/closed testing tester list or the tester Google Group.
2. Send him the Android closed-testing opt-in link.
3. Confirm the available Android release is AMARI `1.1.2`, versionCode `52` or
   newer.

The app is not in Google Play Production yet because Production access is still
blocked in Play Console. Tinashe must use the Alpha/closed testing link until
Production access is approved.

## Install and Sign In

1. Open the Google Play closed-testing opt-in link on the Android phone.
2. Opt in to testing.
3. Install or update AMARI from Google Play.
4. Open AMARI.
5. If this is the first redemption, tap **Invitation Code** and enter
   `AMARI-SLVR-A3B44BDA`.
6. Continue with email using `tinashemapindu@yahoo.com.au`.
7. Enter the one-time email code.
8. If the invite code has already been redeemed, tap
   **Already a member? Sign in with email**.
9. Sign in with `tinashemapindu@yahoo.com.au` and enter the one-time email code.

## Regression Checks

1. Confirm the app reaches the main member experience without a network error.
2. Open **Aligned**.
3. Tap **Projects**.
4. Tap at least three project rows.
5. Confirm each project opens a detail view without requiring **Save** first.
6. In project detail, test **Keep me updated**, **Save**,
   **Connect with project creator**, and any project link.
7. Tap **Your pass**, then **Email details**.
8. If no mail app opens, confirm the Android share sheet appears.
9. Test **Share to apps** and **Scan pass**.

## Notes to Collect

- Device model and Android version
- Installed AMARI version/build shown by Google Play, if visible
- Whether the invite-code path or returning-member email sign-in was used
- Screenshots or exact text for any network/auth/project/pass failure

## Command

Print this test script from the repo:

```powershell
npm run test:mobile-flows:tinashe
```
