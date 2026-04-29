# AMARI Onboarding Discovery Plan

Last updated: 2026-04-29

## Goal

Add a required first-run onboarding step after invite-code redemption and email
authentication that captures useful community, investment, and product-market-fit
signals without over-collecting personal information.

The flow should feel like an AMARI artifact, not a form.

## Placement in Auth Flow

Target flow:

1. User enters invite code.
2. User authenticates by email OTP/magic link, Google, or Apple.
3. App redeems invite code and creates/activates member row.
4. If `members.onboarded_at` is null, route to discovery onboarding.
5. User completes the AMARI Signal Map and three discovery prompts.
6. App writes structured onboarding response data.
7. App sets `members.onboarded_at`.
8. User enters the main tabs.

Returning members with `onboarded_at` already set should never be blocked.
Review/demo accounts should have a seeded completed response so reviewers can
reach the app quickly.

## 2026-04-28 Implementation Update

The first shipped implementation uses a four-step post-auth route group:

1. `Where do you concentrate your time?`
   - One-word answers: `Building`, `Investing`, `Operating`, `Creating`,
     `Performing`, `Specialising`.
2. `What stage is your current work?`
   - One-word answers: `Idea`, `Building`, `Launched`, `Traction`, `Scaling`,
     `Established`.
3. `What are you looking for from AMARI?`
   - One-word answers: `Capital`, `Talent`, `Customers`, `Collaborators`,
     `Distribution`, `Counsel`, `Community`.
4. `Signal map`
   - Six sharp axes: `Investor`, `Founder`, `Operator`, `Creator`,
     `Domain Specialist`, `Artist`.
   - Users drag the AMARI A across an angular SVG graph or manually adjust
     axis numbers underneath.
   - Presets seed the graph but do not submit until the user taps
     `Enter AMARI`.

Current implementation files:

- `app/(onboarding)/index.tsx`
- `app/(onboarding)/_layout.tsx`
- `queries/onboarding.ts`
- `supabase/migrations/20260428000001_onboarding_security_foundation.sql`
- `scripts/verify-onboarding-security.mjs`
- `scripts/verify-security.mjs`

## Deferred Full Open Launch Upgrade: 3D 6D Signal Object

Decision on 2026-04-29: keep the first public testing/employee build on the
stable 2D six-axis signal map. Save the 3D version for the wider full open
launch when there is enough time to design, test, and tune it properly on iOS
and Android.

The current UI is not the final vision. It captures six-dimensional structured
data, but renders it as a 2D radar/spider graph to reduce release risk. The
future launch version should feel like a manipulatable AMARI artifact:

- Render a sharp 3D-feeling wireframe, prism, or crystal object rather than a
  flat spider chart.
- Keep the stored data six-dimensional, even though the phone renders a 3D
  projection of that signal.
- Let the user drag the white AMARI A through the object as their blended self.
- Let the user pull individual vertices/corners all the way to an axis when
  they strongly identify with one or two roles.
- Keep preset archetypes underneath as quick starts, but never force the user
  into a preset.
- Preserve the current privacy rule: store final axis values and selected
  answers only, not raw gesture trails, screen replay, or every movement.
- Use AMARI's actual black, white, gold, and restrained accent palette with
  accessible contrast. Do not ship a grey prototype.

Implementation guardrail: do not add a native 3D renderer casually during the
closed testing launch. Revisit options when preparing the full open launch:

1. A React Native SVG/Reanimated pseudo-3D projection if the goal is stability
   and OTA-friendly iteration.
2. Skia or another graphics layer only if the desired interaction cannot be
   achieved cleanly with SVG/Reanimated.
3. A native 3D dependency only after confirming App Store/Play Store build,
   accessibility, and low-end Android performance risk.

Founder check-in trigger: before AMARI moves from controlled employee/testing
distribution to a wider open launch, ask Tapiwa whether to upgrade the
onboarding Signal Map into the 3D six-dimensional AMARI identity object.

## Original Signal Map Concept

Interaction: the user drags the AMARI A mark across a living 2D field. The field
is rendered as a dynamic graph with four poles. The A mark should feel magnetic:
labels brighten as the mark approaches them, haptics fire near each pole, and a
live archetype label updates in real time.

Prompt:

> Place the A where your current builder energy lives.

Axes:

- X axis: `Systems Builder` to `Category Disruptor`
- Y axis: `Capital Architect` to `Culture Catalyst`

Quadrants:

- `Systems Architect`: builds durable infrastructure, teams, governance, and
  operating systems.
- `Market Breaker`: creates new categories, takes contrarian risk, and moves
  quickly before consensus forms.
- `Capital Catalyst`: understands capital, deals, allocation, fundraising, and
  strategic growth.
- `Culture Shaper`: moves people, story, community, influence, taste, and
  distribution.

Stored fields:

- `signal_x`: number from `-1` to `1`
- `signal_y`: number from `-1` to `1`
- `primary_archetype`: enum
- `secondary_archetype`: enum
- `archetype_confidence`: number from `0` to `1`

Why this is useful:

- segments the community without asking invasive questions
- helps matching, event design, editorial personalization, and investor/member
  introductions
- gives AMARI a useful aggregate view of the community's builder makeup

## Screen 2: Capital Motion

Presentation: swipeable cards or a wheel of cards. User chooses one primary and
optionally one secondary.

Prompt:

> In the next 6-12 months, what capital motion matters most?

Options:

- `Raising`: I am preparing to raise or actively raising.
- `Deploying`: I invest, allocate, acquire, or back operators.
- `Partnering`: I need strategic partners, customers, or distribution.
- `Building`: I am hiring, shipping, or scaling operations.
- `Exploring`: I am still shaping the thesis.

Optional follow-up, only if useful:

> What stage best describes this?

Buckets only, no exact amounts:

- `idea`
- `pre-seed`
- `seed`
- `series-a-plus`
- `growth`
- `private-market`
- `not-applicable`

Why this is useful:

- tells AMARI who is investable, who can invest, and who needs strategic support
- avoids collecting exact financial capacity or sensitive wealth data
- creates product-market-fit signal around what the community is trying to do

## Screen 3: Highest-Leverage Introduction

Presentation: a horizontal slide with weighted chips. User drags three chips
into a priority lane: `critical`, `useful`, `later`.

Prompt:

> What introduction would create the most leverage for you right now?

Options:

- `Investors or allocators`
- `Founders or operators`
- `Customers or enterprise buyers`
- `Strategic partners`
- `Technical/product talent`
- `Board/advisory talent`
- `Media, story, or distribution`
- `Government/institutional access`

Stored fields:

- `leverage_need_primary`
- `leverage_need_secondary`
- `leverage_need_tertiary`

Why this is useful:

- powers Aligned matching and event curation
- reveals demand clusters for AMARI programming
- gives the team real product-market-fit data without needing a long survey

## Screen 4: Contribution Signal

Presentation: the A mark becomes a seal. User taps cards that orbit it. Each tap
adds that contribution to the seal.

Prompt:

> What can AMARI reliably call on you for this quarter?

Options:

- `Capital perspective`
- `Deal flow`
- `Operating expertise`
- `Product/technical expertise`
- `Hiring/talent access`
- `Strategic introductions`
- `Venue/event access`
- `Mentorship`
- `Story/distribution`

Optional free text:

> One specific thing I can help with:

Free text must be optional, length-limited, and classified as sensitive member
metadata.

Why this is useful:

- balances asks with offers
- identifies high-value contributors and community supply
- helps AMARI create reciprocity instead of just collecting needs

## Completion Screen

Prompt:

> Signal received.

Show:

- primary archetype
- one line explaining what AMARI will use it for
- privacy assurance: "You can update this later. We use this to match members,
  curate opportunities, and improve AMARI. We do not sell this data."

CTA:

- `Enter AMARI`

## Data Model

The implemented table is now `public.member_onboarding_responses` with six
axis scores and constrained one-word enum answers. The evidence ledger and
snapshot tables are created in
`20260428000001_onboarding_security_foundation.sql`.

Original draft table:

```sql
create type onboarding_archetype as enum (
  'systems_architect',
  'market_breaker',
  'capital_catalyst',
  'culture_shaper'
);

create table public.member_onboarding_responses (
  member_id uuid primary key references public.members(id) on delete cascade,
  signal_x numeric not null check (signal_x >= -1 and signal_x <= 1),
  signal_y numeric not null check (signal_y >= -1 and signal_y <= 1),
  primary_archetype onboarding_archetype not null,
  secondary_archetype onboarding_archetype,
  archetype_confidence numeric check (archetype_confidence >= 0 and archetype_confidence <= 1),
  capital_motion_primary text not null,
  capital_motion_secondary text,
  capital_stage text,
  leverage_need_primary text not null,
  leverage_need_secondary text,
  leverage_need_tertiary text,
  contribution_signals text[] not null default '{}',
  contribution_note text,
  consent_version text not null,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS rules:

- user can insert/select/update only their own row
- admin direct reads are allowed only if audited, or through a separate admin
  function
- aggregate analytics views must suppress `contribution_note` and direct
  identifiers
- no anon access

Analytics views:

- archetype distribution
- capital motion distribution
- highest leverage needs
- contribution supply
- needs vs supply matrix
- onboarding completion by invite batch and membership tier

## UX Requirements

- Must be completeable in under 90 seconds.
- Must have motion and haptics, but no user should be blocked by animation.
- Must work on small Android screens and iPhone SE width.
- Must use accessible labels for the draggable mark and selectable cards.
- Must have reduced-motion fallback.
- Must persist draft answers locally only until submit, then clear local draft.
- Must not show sensitive answers in notifications, screenshots, or analytics
  logs.

## Implementation Phases

1. Add schema/RLS/tests.
2. Add routing gate after auth: unauthenticated -> auth, authenticated but not
   onboarded -> discovery onboarding, onboarded -> tabs.
3. Build Signal Map component with gesture handling and deterministic archetype
   scoring.
4. Build three dynamic question screens.
5. Add submit mutation and mark `members.onboarded_at`.
6. Add admin aggregate dashboard/read model later; do not block app release on
   admin analytics.
7. Add regression tests for RLS, routing, completion, and no PII logs.

## Product Metrics

- onboarding start rate after successful auth
- completion rate
- drop-off by screen
- archetype distribution
- capital motion distribution
- top three leverage needs
- contribution supply vs member needs
- time to complete
- later retention by archetype and capital motion

## Privacy Guardrails

- The questions should explain why AMARI is asking.
- Avoid exact wealth, exact investment capacity, personal identity documents,
  private addresses, and precise location.
- Use buckets and categories by default.
- Make free text optional and length-limited.
- Let members update answers later from Profile.
- Include these data categories in privacy policy, App Store privacy labels,
  Google Play Data Safety, and any Apple privacy manifest work.
- Do not capture raw graph gesture trails, session replay, screen replay, or
  sensitive onboarding values in analytics.
- Completion must go through `submit_member_onboarding`; the client must never
  update `members.onboarded_at` directly.
