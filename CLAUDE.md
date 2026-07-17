# AMARI Mobile — Claude Context

Read `AGENTS.md` first. It is the shared agent contract and it carries the
worktree layout, the operating rules, and the current list of known defects.
Then read `docs/AMARI-WORKING-MEMORY.md` for system state.

Three things that catch people out, repeated here because they are expensive:

- **Work in `C:\amari-ui-build`** (branch `release/v2-redesign-signed`). The
  OneDrive checkout sits on an older branch and does **not** contain the news
  feed, entity engine, or push system. Searching it will tell you those features
  do not exist.
- **Never edit app runtime code without explicit per-task approval from Tapiwa.**
  `app/`, `components/`, `lib/`, `hooks/`, `queries/`, `supabase/`, `app.json`.
  Reading is fine. Writing needs a yes, every time. Docs under `docs/` are fine
  when asked for.
- **PRs only.** Never commit directly to `release/v2-redesign-signed`.

The AMARI standard is to push beyond generic mobile UI while staying rigorous
about security, privacy, accessibility, and store compliance. Real data or an
honest empty state — never invent numbers, matches, or claims about what the app
did for a member.
