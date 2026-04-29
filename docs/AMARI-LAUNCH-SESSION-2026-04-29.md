# AMARI Launch Session Save - 2026-04-29

This note preserves the operational state from the AMARI mobile launch/testing session so a future Codex or Claude Code session can resume without relying on chat history.

## Current Release State

- Repo/worktree: `C:\amari-mobile-eas-release`
- Branch: `release/v2-redesign-signed`
- Latest shipped commit: `d0449aa fix: add pulse bridge tile spacing`
- iOS build: `1.1.1 (14)`, EAS build `d243b148-8a4d-4ed7-9cc1-3102c7a21ed3`
- Android build: `1.1.1`, version code `47`, EAS build `2665d203-85f8-4f6a-9534-4fd9886a0587`
- Android AAB archive: `C:\Users\tapiw\amari-build\all-amari-aabs\amari-mobile-android-v1.1.1-code47-20260429-d0449aa.aab`
- Android AAB SHA-256: `8C044EF80BF4BD736BB74CE32AB092ED6AF131958516B90C14038A9F9A8874E8`

## Shipped In This Release

- Rebuilt the AMARI Gala nominee story into category sections, horizontal nominee carousels, and detail cards.
- Reworked nominee images for mobile so photos use `contain`/responsive sizing and do not crop faces.
- Replaced compressed/AI-sounding nominee blurbs with tighter human editorial copy.
- Added Pulse bridge tile spacing so the hero story and lower tiles no longer touch.
- Built and submitted Android version code `47` to Google Play `alpha` / closed testing.
- Built and uploaded iOS build `14` to App Store Connect/TestFlight.

## Important Links

- TestFlight public link: https://testflight.apple.com/join/PTXR8jzc
- App Store Connect TestFlight iOS builds: https://appstoreconnect.apple.com/apps/6762464403/testflight/ios
- App Store Connect AMARI beta group: https://appstoreconnect.apple.com/teams/73818d7a-e56a-4a61-9a06-8561cde93984/apps/6762464403/testflight/groups/a8b0ebf3-5a14-4665-9dd9-eafd5ff13cad
- Google Play app dashboard: https://play.google.com/console/u/0/developers/9098912053143270806/app/4976387495678793526/app-dashboard
- Google Play closed testing Alpha: https://play.google.com/console/u/0/developers/9098912053143270806/app/4976387495678793526/tracks/4698336449985963364
- Google Play app bundles: https://play.google.com/console/u/0/developers/9098912053143270806/app/4976387495678793526/bundle-explorer-selector
- Android tester install link: https://play.google.com/store/apps/details?id=com.amari.mobile
- Expo builds: https://expo.dev/accounts/t.jeremy.n/projects/amari-mobile/builds
- Android EAS submission: https://expo.dev/accounts/t.jeremy.n/projects/amari-mobile/submissions/34f26ffb-2e80-4aa1-9be7-01670249bb92
- iOS EAS submission: https://expo.dev/accounts/t.jeremy.n/projects/amari-mobile/submissions/1368df59-3ecf-4e39-a8fc-aeca97bc717e
- GitHub Actions Android build run: https://github.com/tapiwanashenyerenyere-afk/amari-app/actions/runs/25101012410
- Supabase project: https://supabase.com/dashboard/project/eavnuxccdxqyzvnspmaq

For a clickable launch board, open `docs/AMARI-LAUNCH-RESTORE-LINKS.html`.

## Tester And Invite Codes

The live invite-code list is intentionally not committed here because this GitHub repository is public. The complete current list was saved locally in the gstack checkpoint for this session and remains queryable from Supabase `public.invitation_codes`.

To retrieve the named staff/member invite state from a trusted local machine:

```powershell
npx supabase db query --linked --output table "select code, recipient_name, recipient_email, tier_grant::text as tier, grants_admin, staff_role_grant, used_by, used_at, expires_at from public.invitation_codes where recipient_name is not null order by issued_at desc nulls last, code limit 80;"
```

Known named invite owners created/confirmed in this session include staff silver invites, Nyapal, Charmaine, Jamal Elsheikh, Olivier Permal, Christina Mekonnen, Daniel Olasoji, and Meron Negassi. Meron already has `is_admin: true` in Supabase auth metadata. If his Admin tab is missing, he should update through TestFlight, force close/reopen, then sign out/sign in with his registered email; reinstall if needed.

## Outstanding Work

1. Confirm Apple approves TestFlight external beta review for iOS build `14`.
2. Confirm Google Play propagation for Android version code `47` in Alpha/closed testing.
3. Keep collecting employee feedback, especially project additions and onboarding friction.
4. For the wider launch, revisit RLS/security audit, MFA/step-up auth, EAS Update/code-signing policy, and the saved 3D six-axis onboarding graph concept.

## Operational Rules To Preserve

- Use PRs for all repo changes; do not commit directly to main.
- Use Conventional Commits.
- Do not hide Mapbox attribution.
- Do not ship production EAS Updates without code signing/Enterprise decision resolved.
- Keep the AMARI app pushing beyond generic UI while preserving accessibility and mobile fit.
