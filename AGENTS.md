# AMARI Mobile Agent Context

Before making changes, read:

1. `docs/AMARI-WORKING-MEMORY.md`
2. `docs/RELEASE-WORKFLOW.md`
3. `docs/ONBOARDING-DISCOVERY-PLAN.md`
4. `docs/SECURITY-HARDENING-ROADMAP.md`
5. `docs/eas-update.md`

## Operating Rules

- Use PRs for every change. Do not commit directly to the release branch.
- Keep commits Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`.
- Use `tapiwanashenyerenyere@gmail.com` as the commit author email.
- Preserve user work in dirty worktrees. Do not reset or revert unrelated
  changes.
- Run `npm run verify:release` before release-facing PRs when practical.
- Do not publish unsigned production EAS Updates.
- Do not commit private keys, service-account JSON, keystores, `.pem` files, or
  generated build artifacts.

## Product Ethos

AMARI should not feel like a generic app template. The collaboration standard is
to push the product to the edge of what feels premium, sharp, and culturally
specific while staying disciplined on security, privacy, accessibility, and App
Store/Play Store compliance.

When choosing between safe/default UI and a stronger AMARI-native interaction,
prefer the stronger product idea if it can be shipped responsibly. If it cannot
be shipped safely yet, document the full version and ship the reliable baseline.
