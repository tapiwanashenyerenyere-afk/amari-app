# Release verification playbook

How to independently verify and ship an AMARI mobile release. This is the method
used to verify and ship 1.2.5 (see `docs/releases/1.2.5-artifacts.md` for the
worked example). It complements `docs/RELEASE-WORKFLOW.md` (build/submit
mechanics) — read that too.

Governing principle: **reproduce, don't trust.** A handoff's claims — "all tests
pass", "prod is healthy", "the binary is correct" — are starting points to
re-derive yourself, not evidence to act on.

## 1. Verification gate (run before trusting a handoff or shipping)

Run these in order. Any failure stops the release.

**Artifact provenance — prove the binary matches the branch.** Signed binaries are
built from a mobile source commit. After PRs are squash-merged that commit is
often orphaned, so `git branch --contains <commit>` returns empty even though
`git cat-file -t <commit>` shows it's a real commit — that's expected, not a
problem. Prove the binary represents current release HEAD with:

```
git diff --stat <build-commit> HEAD -- app components lib hooks queries \
  constants assets app.json package.json package-lock.json \
  babel.config.js metro.config.js eas.json
```

An **empty diff means the binaries are still valid** — later backend/doc commits
do not change the mobile runtime. A non-empty diff means the binaries no longer
represent the branch: do not ship them, land the change through CI, and rebuild
with incremented build numbers.

**Re-download and re-hash both artifacts.** Fetch the `.aab` and `.ipa` from the
EAS artifact URLs recorded in `docs/releases/<version>-artifacts.md`, recompute
size and SHA-256, and compare to the recorded values. A mismatch is a hard stop.

**Local gate.** From a clean worktree:

```
npm ci && npm run lint && npm run typecheck && npm run verify:security \
  && npm run test:ci \
  && npx --yes deno test --allow-read --no-config supabase/functions \
  && npm run verify:release && npx expo config --type public --json
```

Known-clean baseline: ESLint reports warnings but **0 errors**; Jest and the Deno
edge-function tests are all green.

**Linked-production truth — not a clean local reset.** The database that matters
is production, and a clean local `supabase db reset` cannot detect production
drift (see §2). Check the live project:

```
npx supabase migration list --linked          # every local has a matching remote
npx supabase db push --linked --dry-run        # must report "Remote database is up to date"
npx supabase functions list                    # confirm expected edge-function versions
```

Then confirm the pipeline crons are healthy (query `cron.job_run_details`: the
ingest and enrich jobs should show ~48 successes / 0 failures over 24h).

**Trajectory review.** Read the merged feature-PR diffs and confirm the claimed
safety properties are actually in the code — SSRF/redirect boundary re-validated
at every hop, atomic budget reservation against the hard ceiling, one-article
prompt isolation, lease acquire/renew/release, pending-member RLS, truthful
entity-follow ranking. Confirm in the code; do not accept the summary. A
read-only sub-agent is a good way to do this in parallel.

## 2. Migration discipline (this caused a real production 500)

- Supabase records migration **version names, not content hashes.** Editing an
  already-applied migration file does **not** replay it — production keeps the old
  definition while a clean CI rebuild shows the new one. The freshly-deployed
  function then calls something production doesn't have → 500.
- **A clean-database pgTAP run cannot catch this.** Only the linked-production
  dry-run or a live invocation exposes the ledger mismatch. That's why §1 checks
  linked prod, not just a local reset.
- **Never edit an applied migration as the deployment mechanism.** Always write a
  new forward-only migration and verify `supabase db push --linked --dry-run`
  before applying.
- pgTAP tests assert clean-database state (e.g. exact `news_sources` counts, all
  active). A data migration that changes a count or an `active` flag **must** also
  update the matching assertion in `supabase/tests/database/*.test.sql`, or CI
  breaks.

## 3. Backend changes decouple from the binaries

A data-only or SQL migration (news sources, RPCs, functions) does **not**
invalidate the signed binaries — confirm with the mobile-input diff in §1, then
ship it as its own PR and `supabase db push --linked` **without rebuilding**. Only
a change to mobile/native code, dependencies, or `app.json` forces a rebuild and
new build numbers. This lets backend fixes (e.g. repairing a feed) land during a
release without invalidating an already-reviewed binary.

## 4. Degraded-feed diagnosis

Probe a candidate feed URL and inspect the redirect chain and content type:

```
curl -sSL --max-time 20 -o body -D headers \
  -w "final=%{url_effective} http=%{http_code} redirects=%{num_redirects}\n" <url>
```

Check `headers` for the content type and the first bytes of `body` for
`<rss` / `<feed` / `<?xml`. Common cases: an apex host that 302s cross-host to
`www` is (correctly) rejected by the ingester's redirect boundary — fix by
pointing `feed_url` at the canonical `www` host that serves the feed with no
redirect. A feed that now returns HTML has been removed upstream — set
`active = false`. **Never weaken the redirect or content-type validation to force
a feed to pass.** After the fix, a protected ingest smoke should return
`degraded: false` with zero source failures.

## 5. Store submission (see RELEASE-WORKFLOW.md for full detail)

- `eas submit` uses stored credentials — **no Apple 2FA, no login prompt.**
- **Android Play-bound builds must come from GitHub Actions** (local EAS Android
  credentials use the wrong upload key). Submit **by build ID** (never `--latest`)
  and run the submit from `C:\amari-mobile-eas-release` — the only worktree with
  the gitignored Play service-account key. Android ships to closed-testing
  **Alpha** (production is gated by Google's 12-testers-for-14-days rule).
- **iOS is full production** via EAS → App Store Connect review.
- Two human-only finishes: Play Managed Publishing → press **Publish** after
  Google approves; iOS manual release → press **Release** after Apple approves.

## 6. Driving the store consoles in a browser

If you complete the store steps via browser automation rather than handing them
to the user:

- **App Store Connect requires the browser extension to be granted site-access
  for `appstoreconnect.apple.com`** (Play Console is typically already granted).
  The user must also be signed in — you cannot enter Apple credentials or 2FA.
- If screenshots fail (a `clip.scale` error, or a `0x0` viewport when the window
  is backgrounded), **work off the accessibility tree** instead — read the page,
  find elements by description, and click by element reference. This is reliable
  when screenshots are not.
- **The ASC localization selector can shift between reading it and clicking it** —
  a stray click can add an unwanted locale, and localized text (like "What's New")
  can land in the wrong localization. **Re-read the active-localization label
  immediately before typing any localized field**, and after filling, confirm both
  required locales (English (U.S.) and English (Australia)) are populated — a
  missing one blocks "Add for Review" with a specific validation error.
- In the iOS submit flow, when attaching the build, **verify the literal build
  number** (superseded builds can also appear in the list — pick the reviewed
  one). Prefer **manual release** when the build has not had on-device testing, so
  approval does not auto-publish to the public.

## 7. What automated tests do not cover

The unit/structural tests assert source text and pure logic; they do **not**
render screens or exercise the app on a device. New UI (onboarding, entity
following, sign-in, keyboard/accessibility) ships **unverified on hardware**
unless someone installs from Alpha/TestFlight and runs it. The closed Alpha track
and manual iOS release are the windows to do that before anything reaches the
public. Always surface this as an explicit release risk rather than implying the
release was fully verified.
