# AMARI Mobile — Agent Context

Entry point for Codex, Claude, and any other agent working this repo.

**Verify before you trust.** This file is a point-in-time record. It was last
reconciled against the code on **2026-07-17** at release head `c6eee96`
(v1.2.4). If you are reading it much later, check `git log` before relying on
any claim here. Docs in this repo have gone stale before — the previous version
of this file described v1.1.2 and was two months behind the code.

## Read Before Changing Anything

- `docs/AMARI-WORKING-MEMORY.md` — current system state, what shipped, what is
  known-broken. Read this first.
- `docs/RELEASE-WORKFLOW.md` — how builds and store submissions actually work,
  including the signing trap that has cost real failed submits.
- `docs/SUPABASE-MIGRATION-HISTORY.md` — migration guardrail. Still in force.
- `docs/SECURITY-HARDENING-ROADMAP.md` — security posture.
- `docs/eas-update.md` — OTA policy (short version: OTA is blocked; ship via
  store builds).

## Operating Rules

- **PRs for every change.** Never commit directly to
  `release/v2-redesign-signed`. It is the live release line.
- **Never edit app runtime code without explicit per-task approval from Tapiwa.**
  This covers `app/`, `components/`, `lib/`, `hooks/`, `queries/`, `supabase/`,
  `app.config.js`, `app.json`. Reading is always fine. Writing is not. Docs
  under `docs/` are fine when asked for. This is a standing instruction from the
  principal, not a suggestion.
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`.
- Commit author email `tapiwanashenyerenyere@gmail.com`.
- Preserve user work in dirty worktrees. Do not reset or revert work you did not
  author.
- Run `npm run verify:release` before release-facing PRs.
- Do not publish unsigned production EAS Updates.
- Never commit private keys, service-account JSON, keystores, `.pem` files, or
  build artifacts.

## No Fake Data

Real data or an honest empty state. Never invent numbers, matches, people,
partnerships, or events. Never tell a member the app did something it did not
do. This rule has already been breached once in shipped code — see
`getPulseMatchFooter` under Known Defects. When you find a surface that claims
personalisation, verify the claim is actually computed before you trust it.

## Worktree Layout — Get This Right

There are three checkouts of this repo. They are not interchangeable.

| Path | Branch | Purpose |
|---|---|---|
| `C:\Users\tapiw\OneDrive\AMARI Group App\amari-mobile` | `feature/app-pitch-deck` | Main checkout. Usually has uncommitted docs work — **do not disturb.** Does **not** contain the news pipeline. |
| `C:\amari-ui-build` | `release/v2-redesign-signed` | **Build and development worktree. Work here.** |
| `C:\amari-mobile-eas-release` | `docs/final-user-test-script` | **Android Play submits must run from here** — holds the gitignored Play service-account key. |

If you search the OneDrive checkout for the news feed, entity engine, or push
system you will not find them and may conclude they do not exist. They are on
the release line. Work in `C:\amari-ui-build`.

## Current State — v1.2.4 (11 Jul 2026)

Release branch `release/v2-redesign-signed`, head `c6eee96`. Both platforms
shipped 1.2.4. Android goes to the Play **closed testing / Alpha** track; iOS to
App Store review. This is the version members are running today.

What is live: invite/OTP auth, Aligned (map + project shelves + consented
introductions), Events with QR ticketing, Pulse (hand-written editions **and** an
algorithmic news briefing — two separate systems, see working memory), the
intelligence feed with LLM classification, entity tracking, push notifications,
in-app issue reporting with admin fan-out, and a five-tier membership model.

## Known Defects — Read Before You Touch These Areas

These are verified against the code, not speculation. They are open as of
2026-07-17.

**`getPulseMatchFooter` fabricates a personalisation claim.** `lib/pulse.ts:110`,
called at `app/(tabs)/index.tsx:102`. It takes only the member profile — the
edition is never passed in — then writes "Matched to {interest} and {city} in
your profile" onto every Pulse edition regardless of content. It is structurally
incapable of matching anything. `__tests__/lib/pulse.test.ts:85` locks the
behaviour in rather than catching it. This breaches the no-fake-data rule and
should be removed, not repaired. Note the contrast: the briefing's `reasonLabel`
in `lib/contentMeta.ts` does real tag matching and is honest.

**Entity follows have no client UI.** `tracked_entities` and
`member_entity_follows` exist, the ingester rotates entities every run and tags
articles, and `get_news_feed` carries an entity boost term. But nothing in
`app/`, `components/`, `hooks/`, `lib/`, or `queries/` references either table.
No member can follow anything, so the boost evaluates to zero for everyone,
always. Backend built, front door missing.

**Onboarding never sets feed interests.** `set_feed_interests` is called from
exactly one place: `components/pulse/InterestSheet.tsx` (via `queries/news.ts`).
The onboarding flow is the archetype quiz for Aligned matching — unrelated to
the feed. A member who never finds the Tune control has no declared interests,
so their tag boost is 1.0 and the feed falls back to recency × source weight ×
relevance. The ranking engine works correctly for anyone who turns it on; most
members have never been offered the chance. As of the last prod check, 2 of 21
active members had interests set and 0 had entity follows.

**News-pipeline cron jobs are not in version control.** `20260301000005_cron_jobs.sql`
registers four crons (aligned matches, daily seed, rate-limit cleanup, match
expiry) — but the news ingest, enrich, affinity fold, briefing push, and
engagement digest schedules exist only as copy-paste SQL in
`supabase/functions/NEWS-PIPELINE.md`. They live in the production database and
nowhere else. Restore this project from migrations and the pipeline comes up
dark: tables and functions present, nothing ever firing. The repo already has the
file and the pattern to fix this properly.

**`components/TierGate.tsx` carries a stale four-tier map that omits gold.**
`{ member: 1, silver: 2, platinum: 3, laureate: 4 }` against the canonical
`{ member: 1, silver: 2, gold: 3, platinum: 4, laureate: 5 }`. **Nothing imports
it** — verified by grep — so there is no live bug today. But wiring it up as-is
would evaluate a gold member (canonical level 3) as platinum (its level 3) and
silently grant platinum access. Delete it or fix it; do not use it.

**Corridor tab is hidden from everyone.** `lib/theme.ts` sets
`TAB_VISIBILITY.corridor = 99` and `CustomTabBar` hides any tab where
`requiredLevel >= 99`. `lib/constants.ts` says `2`, but the tab bar reads
`theme.ts`, so that value is dead. The screen exists and renders waitlist copy;
nobody can reach it.

**Two design-token systems coexist.** `lib/constants.ts` (legacy "V7") and
`lib/theme.ts` (current "V2") both define tiers and tokens. Numbering agrees,
labels do not (`'Gold'` vs `'GOLD MEMBER'`). `app/admin/*` still reads
`constants.ts`.

**Version drift.** `package.json` says `1.2.3`; `app.json` says `1.2.4`. The
1.2.4 bump only touched `app.json`. Expo reads `app.json`, so store builds are
correct — but anything reading `package.json` gets the wrong answer.

**Orphaned dead code.** `components/pulse/IntelligenceFeed.tsx` is unexported and
unimported — a PR #48 deletion that did not stick. Harmless, compiles, should go.

**Crash reporting is inactive.** `lib/sentry.ts` and `lib/posthog.ts` are guarded
shims that dynamically `require()` their SDK only if a DSN/key env var is set —
and neither `@sentry/react-native` nor `posthog-react-native` is in
`package.json`. Every export is a no-op today and `lib/reportError.ts` falls back
to `console.error`, so native crash visibility is absent. Activating means
dependency + Expo plugin + DSN + a new native build.

## Product Ethos

AMARI is built for a high-trust, culturally ambitious community. It should feel
like AMARI, not a generic Expo template.

- Push the product to the edge of premium, sharp, and culturally specific — while
  staying disciplined on security, privacy, accessibility, and store compliance.
- Speed is not carelessness. Strong product taste sits on top of disciplined
  release engineering.
- Prefer a bold intentional interaction over safe average UI. If the stronger
  version cannot ship safely yet, ship the reliable baseline and document the
  stronger one.
- Treat privacy and trust as product features, not compliance paperwork.
- Membership is earned, not given.
- No user-generated content. AMARI curates.
- No gender fields. No job titles. Names only.
