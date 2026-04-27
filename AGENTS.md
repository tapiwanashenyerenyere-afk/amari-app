# AMARI Mobile Agent Notes

These notes are for Codex, Claude Code, and other coding agents working in this
repo.

## Operating Rules

- Use pull requests for all changes. Do not commit directly to
  `release/v2-redesign-signed` or `main`.
- Use Conventional Commit style for branch commits and PR titles.
- Before native release, EAS Update, TestFlight, or Play Store work, read
  `docs/RELEASE-WORKFLOW.md` and `docs/eas-update.md`.
- Before security/privacy hardening work, read
  `docs/SECURITY-HARDENING-ROADMAP.md`.
- Before post-auth onboarding/discovery work, read
  `docs/ONBOARDING-DISCOVERY-PLAN.md`.
- Run `npm run verify:release` before release PRs or native submissions.

## Android Play Upload

Play-bound production Android builds must use the GitHub Actions workflow in
`.github/workflows/eas-build.yml` unless EAS remote Android credentials have
been verified against Play Console's upload certificate.

The 2026-04-27 Android upload fix is documented in
`docs/RELEASE-WORKFLOW.md` under `Play-Bound Android Build` and
`2026-04-27 Android Submit Notes`.

Key outcome: Google Play accepted Android version `1.1.0`, versionCode `39`,
from EAS build `75ec1c15-b67b-4577-ae50-7e15838e2683` after rebuilding through
the GitHub workflow that injects the stored upload keystore.
