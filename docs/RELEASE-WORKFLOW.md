# AMARI Release Workflow

The production release path for the AMARI mobile app.

Last reconciled: **2026-07-16**, at v1.2.4. Verify against `git log` and
`npx eas build:list` before trusting any specific build number below.

## Read This First — The Two Traps

Both have cost real failed submissions. They are not theoretical.

**Android production builds must come from GitHub Actions, never locally.**
A local `npm run release:android` uses EAS *remote* Android credentials, which
are the **wrong upload key**. Play rejects the AAB. The GitHub Actions workflow
`.github/workflows/eas-build.yml` injects the correct keystore from repo
secrets. This cost a failed 1.2.4 submit on 11 Jul.

- Play expects SHA1 `C4:CD:C3:BA:73:2E:42:07:2D:D0:5E:2B:0F:2D:C2:9A:74:6F:31:4B`
- EAS remote credentials produce SHA1 `37:21:FB:C3:25:7D:C8:C0:8E:BE:8E:CA:79:2F:4E:8D:2B:1A:BA:6A`

iOS local builds are fine — Apple accepts `npm run release:ios:ci`.

**The Android Play submit must run from `C:\amari-mobile-eas-release`.**
That worktree holds the gitignored Play service-account key at
`C:\amari-mobile-eas-release\google-services.json`, which `eas.json` references
as `./google-services.json`. `C:\amari-ui-build` does not have the key and the
submit fails there with "google-services.json doesn't exist". iOS submits work
from any worktree — they use the ASC API key held on EAS.

## Worktree Layout

| Path | Branch | Use for |
|---|---|---|
| `C:\amari-ui-build` | `release/v2-redesign-signed` | Development, iOS builds, iOS submits |
| `C:\amari-mobile-eas-release` | `docs/final-user-test-script` | **Android Play submits only** (holds the Play key) |
| `C:\Users\tapiw\OneDrive\AMARI Group App\amari-mobile` | `feature/app-pitch-deck` | Main checkout — do not disturb, usually dirty |

The older `C:\amari-mobile-release` path referenced by previous versions of this
doc no longer exists. Ignore it.

## Daily Development

Use the native dev client, not Expo Go:

```bash
npm run start:dev          # dev client
npm run start:dev:clear    # clean Metro session
npm run android:dev        # launch Android via dev client
```

## Release Verification

Before every release:

```bash
npm run verify:release
```

Runs full ESLint, full TypeScript check, and Expo config validation. Also runs
automatically on `git push`.

## Version Bump

Bump **both** `app.json` and `package.json`. Expo reads `app.json` — that is what
reaches the store — but leaving `package.json` behind causes drift. The 1.2.4
bump touched only `app.json` and the two currently disagree.

## Android Release — Full Path

Trigger the Play-bound build from the release branch:

```bash
gh workflow run eas-build.yml --ref release/v2-redesign-signed -f profile=production
gh run list --workflow eas-build.yml --limit 5
gh run watch <run-id> --exit-status        # ~25 min
```

Get the resulting build ID:

```bash
npx eas build:list --platform android --limit 5 --json
```

Submit that exact ID **from the release worktree**:

```bash
cd /c/amari-mobile-eas-release
npx eas submit --platform android --profile production --id <android-build-id> --non-interactive --wait
```

Do **not** use `eas submit --latest` — it may pick up a locally-built AAB signed
with the wrong key.

**Then someone must press Publish.** Managed Publishing is ON. A submitted build
sits at "Ready to publish" in Play Console → Publishing overview, approved by
Google but not live to testers, until a human clicks Publish. This is easy to
forget and has held releases before.

CI keystore secrets: `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, alias
`amari-key`.

## iOS Release — Full Path

From `C:\amari-ui-build`:

```bash
npm run release:ios:ci
npm run submit:ios
```

To submit for review manually in App Store Connect: create the version via **+**
next to "iOS App", fill "What's New" **in every localization** — the app has both
English (U.S.) primary *and* English (Australia), and a missing AU entry silently
blocks submission — then Add Build → Save → Add for Review → Submit for Review.

**If submission 500s** ("Reading App information... Unexpected response (500)...
UNEXPECTED_ERROR"): this is transient Apple-side propagation lag, usually after
account or agreement changes. Wait 15–30 minutes and retry. It cleared on the
third attempt in July. It is not an agreement block.

**CocoaPods CDN 429s** during build are transient. Retry.

## iOS — What Was Blocking It, and How It Was Fixed

iOS builds failed five times on "Provisioning profile doesn't include the
aps-environment entitlement" after `expo-notifications` was added. Three
compounding causes, fixed in this order (10 Jul 2026):

- **Expired Apple Developer Program License Agreement.** Silently blocked App ID
  access, the Push capability, *and* submissions. Fixed at
  developer.apple.com/account → "Review agreement".
- **Push Notifications capability was OFF** on App ID `com.amari.mobile`. Enabled
  in the Identifiers editor → Save → Confirm.
- **EAS held the stale April provisioning profile** and kept reusing it.
  Regenerate: `npx eas credentials -p ios` (not `-e`, which is invalid) →
  production profile → log in to Apple → Build Credentials → All → when asked
  "reuse the original profile?" answer **no**. Produced profile `8WZ3WUVAT6`,
  which carries push.

An agent cannot drive the `eas credentials` TUI (stdin is not readable) and
cannot enter Apple passwords or 2FA. **That step is always the user's.**

**EU trader status:** the app was available in France, Ireland, and Sweden and
was flagged "Trader Status Not Provided" under the EU DSA. Tapiwa chose to remove
EU availability rather than declare trader status, which would publicly display
the company address. Done via ASC → Pricing and Availability → Manage
Availability. The UK was kept — not EU.

## Account Facts

**Apple.** Account type **Individual** — "Tadiwanashe Nyerenyere", team
`4G3Y288Q4D`, Apple ID `tadiwanashe3@hotmail.com`. Bundle `com.amari.mobile`,
App ID `WU42854D6G`. ASC App ID `6762464403`, SKU `EX1776430680754`, category
Business/Lifestyle. Free Apps Agreement Active; Paid Apps Agreement "New" —
only needed if in-app purchases ship. EAS already holds an ASC API key
("[Expo] EAS Submit", KeyID `K4N2W4XM43`, ADMIN) used for submits.

**Google Play.** Developer account `9098912053143270806` (1C619 Foundry Labs),
app `4976387495678793526`, closed-testing Alpha track `4698336449985963364`.

**Expo/EAS.** Project `@t.jeremy.n/amari-mobile`. `eas login` =
`tapiwanashenyerenyere@gmail.com`. Account `t.jeremy.n` is on the **Starter**
plan.

## Two Open Account Threads

**Play production access is gated.** Google requires **12 testers opted in for 14
continuous days** before the production track opens. Last count was roughly 6
opted in of ~20 invited across four email lists. Until that clears, Android ships
to closed testing only. Send join links from the Play Console Testers tab.

**Apple Organization account (bus-factor fix).** Individual accounts cannot add
team members — that is the fragility. The plan is to enroll **The AMARI Group AU
Pty Ltd (ACN 681 233 965)** as an Organization ($99/yr, same price), invite
Admins with free Apple IDs, then App Transfer the live app into the org. App
Transfer preserves the app, bundle ID, reviews, TestFlight, and users. Blocked
at the D-U-N-S lookup, which has a CAPTCHA an agent cannot solve. Use a
company-owned Apple ID (e.g. `apple@amarigroupau.com`), not a personal one. Legal
name must match ASIC exactly. The sender must have no iOS version "Waiting for
Review" when the transfer initiates.

**Apple portal automation caveat:** developer.apple.com and ASC pages frequently
freeze under browser automation — screenshots time out or come back blank.
`read_page` and `find` still work when screenshots fail. ASC deep-links like
`/apps/{id}/availability` do not hydrate; navigate to
`/apps/{id}/distribution/info` first, then use the sidebar.

## OTA Updates — Blocked

Do not publish unsigned production OTA updates. Signed EAS Updates require the
**Enterprise** plan; the `t.jeremy.n` account is on Starter, and the app config
requires signed updates. **Therefore all changes ship via store builds, not OTA.**
The OTA signing key lives at `amari-mobile-eas-release/certs/private-key.pem` —
keep it local, never commit it.

## Mapbox Attribution — Do Not Remove

Do not set `logoEnabled={false}` or `attributionEnabled={false}`. A release
verifier guards against this. Maps using Mapbox SDK/styles/data must keep the
wordmark and attribution visible and legible. Position and styling can be
adjusted within the allowed controls; the mark cannot be removed. If AMARI wants
no visible Mapbox mark, choose a compliant provider path rather than hiding
attribution.

## Required Environment Variables

Local `.env` and the EAS production environment must include:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AUTH_REDIRECT_URL=https://www.amarigroupau.com/auth-callback`
- `EXPO_PUBLIC_MAPBOX_TOKEN`
- `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

Optional: `EXPO_PUBLIC_MAPBOX_STYLE_URL`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`,
`EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`.

Supabase hosted Auth settings must have Site URL
`https://www.amarigroupau.com/auth-callback`, redirect URLs `amari://auth-callback`
and `https://www.amarigroupau.com/auth-callback`, Google provider enabled for
Android/Web (iOS native client optional — the app falls back to OAuth), and Apple
provider enabled before iOS review while Google login remains visible on iOS.

## App Review Access

App Store Connect must carry Beta App Review credentials for a real Supabase
user. The path: tap "Already a member?" / "Reviewer or existing member sign in",
enter the demo account email and password supplied in ASC, and confirm the
account is an active member with representative tier access and sample content.

## Release History

| Version | Date | Android | iOS |
|---|---|---|---|
| 1.1.2 | 11 May | build 52, Play alpha | build 20, App Store review |
| 1.2.0 | 7 Jul | code 55, Play alpha, published to testers | ipa built, submit failed (agreement) |
| 1.2.1 | 7 Jul | code 56, Play alpha | ipa built, submit failed |
| 1.2.2 | 10 Jul | code 57, Play alpha | blocked (push provisioning) |
| 1.2.3 | 10 Jul | code 58, Play alpha | build 34, submitted for review |
| **1.2.4** | **11 Jul** | **build 60, Play alpha** | **build 35, App Store review** |

1.2.4 carries the testing/hardening baseline (PRs #54, #55). It is the version
members are running.

## Final Checklist

- `npm run verify:release` passes
- Both `app.json` and `package.json` versions bumped and matching
- Migrations applied — see `docs/SUPABASE-MIGRATION-HISTORY.md`
- Supabase Auth Site URL is not `localhost`
- TestFlight reviewer account signs in with email/password
- Google sign-in works or falls back to browser OAuth on iOS
- Sign in with Apple works on a physical iOS device
- Email magic link opens AMARI, or the OTP fallback signs in
- Profile → Account includes Privacy Policy and Delete Account request
- Aligned renders a live Mapbox basemap with attribution intact
- Australia remains state-level only
- Events, Pulse, and membership-card gating match server behaviour
- Android production build came from GitHub Actions, not locally
- Android submit ran from `C:\amari-mobile-eas-release`
- Someone pressed **Publish** in Play Console after Google approved
