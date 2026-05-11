# AMARI Working Memory

Last updated: 2026-05-11

This file preserves the shared working context for AMARI Mobile so future Codex,
Claude, or other agent sessions can resume without relying on chat history.

## Collaboration Ethos

AMARI is being built for a high-trust, high-net-worth, culturally ambitious
community. The app should feel like AMARI, not like a generic Expo starter or
template marketplace product.

The working ethos:

- Push the product envelope to the maximum when it creates a better member
  experience.
- Do not confuse speed with carelessness. Strong product taste must sit on top
  of disciplined release engineering, privacy, security, and review compliance.
- Prefer bold, sharp, intentional interactions over safe average UI.
- If a premium interaction is too risky for the immediate store release, ship
  the stable baseline and document the stronger future version.
- Treat privacy and trust as product features, not compliance paperwork.
- Keep Apple/Google reviewers, employee testers, and future members in mind at
  the same time.

## Standing Collaboration Rules

- Always use PRs. Do not land direct commits on release/main branches.
- Keep release work on isolated branches/worktrees when another agent may be
  active.
- Before branch-mutating operations, check the current branch.
- Use Conventional Commits.
- Use author email `tapiwanashenyerenyere@gmail.com` for commits.
- Do not revert user or other-agent work unless explicitly requested.
- Save durable decisions in GitHub docs, not only in local notes.

## Current Release State

Release branch: `release/v2-redesign-signed`.

Recently merged PRs:

- PR #34: `fix: restore mobile sign-in and project detail flow`
  - Existing members/testers who already redeemed an invite can sign in with
    email OTP instead of being blocked by invite-code validation.
  - Project rows, map results, markers, and search results open a project detail
    view with creator contact, external link, save, and "keep me updated"
    wording.
  - Added `scripts/verify-mobile-flows.mjs` with iOS and Android manual tester
    scripts.
- PR #35: `chore: bump store release to 1.1.2`
  - Bumped `expo.version`, package version, and lockfile version to `1.1.2`
    after App Store Connect rejected additional `1.1.1` uploads because the
    approved `1.1.1` train was closed.

- PR #19: `fix: refine onboarding signal and gala nominee story`
  - White transparent AMARI A in onboarding.
  - Six-axis onboarding graph supports independent axis/corner movement.
  - AMARI Gala nominee story cover, Tatenda Luna image, nominee blurbs, and
    image fit improvements.
- PR #20: `chore: rotate EAS update signing certificate`
  - App/runtime version moved to `1.1.1`.
  - EAS Update certificate rotated.
  - Private key must stay local at `certs/private-key.pem` or via
    `EAS_UPDATE_PRIVATE_KEY_PATH`.
- PR #21: `fix: submit Android releases to closed testing`
  - Android EAS Submit target changed from `internal` to `alpha`.
  - `alpha` is the Google Play closed testing lane used for employee testing.
- PR #22: `docs: record v46 Play release path`
  - Documented the accepted Play v46 path and the signed OTA blocker.

Store artifacts:

- iOS version `1.1.2`, build `19`, uploaded to App Store Connect/TestFlight on
  2026-05-11:
  `https://expo.dev/accounts/t.jeremy.n/projects/amari-mobile/submissions/1068ab4f-9661-4d43-befc-123245697b10`
- Android version `1.1.2`, versionCode `52`, submitted successfully to Google
  Play Alpha/closed testing on 2026-05-11:
  `https://expo.dev/accounts/t.jeremy.n/projects/amari-mobile/submissions/da672749-4490-48ac-b63e-ea65bed15bbc`
- Android production remains blocked by Google Play Console state. Direct
  Android Publisher API tests accepted AAB uploads for versionCodes `51` and
  `52`, then failed updating the `production` track with
  `FAILED_PRECONDITION`. The production track currently has no active release
  and `countryAvailability/production` returns HTTP `204`; Alpha has completed
  release `1.1.2` / versionCode `52`.
- To release Android publicly, first configure/activate production countries or
  first-production-release state in Play Console, then retry production track
  submission for build `0cafe8d2-9e41-4553-bca4-1fd0b94dfd72`.
- Accepted Android AAB archive:
  `C:\Users\tapiw\amari-build\amari-mobile-1.1.2-v52-play-2026-05-11\amari-production-1.1.2-v52.aab`
- AAB SHA256:
  `3f1eef7075e23209c2ee9df95e19cb6e4f1b2c5f843c631aa7f00ff8cf02755f`

Important release gotcha:

- EAS remote Android credentials currently produce an AAB signed with the wrong
  upload key for Google Play.
- Play expects SHA1
  `C4:CD:C3:BA:73:2E:42:07:2D:D0:5E:2B:0F:2D:C2:9A:74:6F:31:4B`.
- The GitHub Actions workflow `.github/workflows/eas-build.yml` injects the
  correct Play upload keystore from GitHub secrets and must be used for
  Play-bound Android production builds until EAS remote credentials are fixed.

## EAS Update Policy

Do not publish unsigned production OTA updates.

Signed EAS Updates were attempted on 2026-04-29 and failed because Expo requires
EAS Enterprise for code-signed updates. The `t.jeremy.n` account was on Starter.

Until AMARI upgrades to Enterprise or changes the update-signing policy, ship
production changes through App Store/TestFlight and Play AAB builds.

## Mapbox Attribution

Do not disable Mapbox logo/attribution by setting `logoEnabled={false}` or
`attributionEnabled={false}`. A release verifier guards against this. If AMARI
wants no visible Mapbox mark, choose a compliant design/provider path rather
than hiding attribution.

Official Mapbox guidance:

- Attribution guide:
  `https://docs.mapbox.com/help/getting-started/attribution/`
- iOS Maps SDK conditions:
  `https://docs.mapbox.com/ios/vision/guides/`

The practical finding is that maps using Mapbox SDK/styles/data must keep the
Mapbox wordmark/logo and attribution visible and legible. Position and styling
can be adjusted within the allowed controls, but the mark cannot be removed or
altered. If a custom attribution approach hides the built-in attribution control,
AMARI must still provide required attribution and a telemetry opt-out path, and
custom approaches may need Mapbox approval.

## Onboarding Product Direction

Current shipped onboarding captures structured six-axis member signal in a 2D
radar/spider graph because that was the safer closed-testing release path.

Deferred full open launch idea:

- Build a sharp, 3D-feeling six-dimensional AMARI identity object.
- Let members move the white AMARI A through the object as their blended self.
- Let members pull individual vertices/corners fully toward axes such as
  `Founder`, `Investor`, `Operator`, `Creator`, `Domain Specialist`, and
  `Artist`.
- Keep the data model six-dimensional even if the screen is a 3D projection.
- Preserve privacy by storing final axis values and selected answers only, not
  raw gesture trails.

Before AMARI moves from controlled employee/testing distribution to a wider open
launch, ask Tapiwa whether it is time to upgrade the Signal Map into this 3D
six-dimensional AMARI identity object.

## Security Posture

The security direction is documented in `docs/SECURITY-HARDENING-ROADMAP.md`.
Core principles:

- No wider invite distribution until RLS and onboarding security checks pass.
- No service-role keys in bundled iOS/Android code.
- No sensitive logs, screen replay, or raw onboarding gesture trails.
- Device trust should influence risk, not become a brittle single gate.
- The onboarding graph is an evidence ledger and matching signal, not a hidden
  human-value score.
- Never expose individual member scores to partners.

## Useful Commands

Run release verification:

```powershell
npm run verify:release
```

Trigger Play-bound Android production build with the correct upload key:

```powershell
gh workflow run eas-build.yml --ref release/v2-redesign-signed -f profile=production
gh run list --workflow eas-build.yml --limit 5
```

Submit an exact Android build ID to Play Alpha:

```powershell
npx eas submit --platform android --profile production --id <android-build-id> --non-interactive
```

Submit an exact iOS build ID to App Store Connect:

```powershell
npx eas submit --platform ios --profile production --id <ios-build-id> --non-interactive
```
