# Intelligence feed expansion: overview

**Status:** working spec for an additive build. Nothing in this expansion removes or modifies an existing source, entity, weight, cron schedule, taxonomy tag, or the classifier budget cap. It only adds rows.

## Objective

Widen the source coverage of the intelligence feed so the app holds a durable advantage over generic alerts across technology, startups, venture and private capital, small and medium enterprise, policy and trade, music, visual arts, film and screen, marketing and advertising, and the creator economy, spanning Australia, the United Kingdom, and North America, plus the pan-African and diaspora layer that feeds the corridor.

The advantage is not more keywords. It comes from three things generic alerts cannot do: entity-level tracking of named people and firms, structured funding, chart, and market data, and a small number of curated culture and corridor publications that sit ahead of the mainstream.

## How this plugs into the existing pipeline

The current system is a deterministic pipeline: cron fires the ingest and enrich Edge Functions, RSS and Atom feeds are fetched, a classifier scores each item on the ten-topic and four-region taxonomy, and a SQL RPC ranks a shared pool per member. This expansion touches only the input side of that pipeline.

- **New feed rows** go into `news_sources`. Mechanically every addition reduces to either a direct RSS or Atom URL, or a Google News RSS search URL, both of which the existing ingester already handles.
- **New entity rows** go into `tracked_entities` (people, companies, themes), which the ingester already rotates through as per-entity Google News queries and which stack the follow boost.
- **Taxonomy is unchanged.** Creative Industries and Culture already exist as topic tags, so the music, arts, and marketing sources need no new tags. Do not add topics or edit `feedTags.ts` or the classifier taxonomy.
- **Copyright posture is preserved.** The schema stores headline, snippet, image, and link only, and never full article text. Every new source is ingested under the same rule.
- **The video and audio slots get activated.** `media_type` already supports `video` and `audio`. YouTube channel feeds (which are Atom) and podcast feeds (which are RSS) are how those slots finally get real content.

## Guardrails

1. **Additive only.** No `DELETE`, no `UPDATE` to existing rows, no change to weights, cron, budget, or schema beyond adding rows. Guard every insert so a re-run cannot duplicate (`on conflict do nothing`, or `where not exists`).
2. **Verify feeds before inserting.** Feed availability is empirical. Where the catalogue marks a feed `(verify)`, fetch and confirm it returns valid RSS or Atom before inserting. If a feed fails, skip it and log it. Do not guess or fabricate a feed URL.
3. **No terms-breaching acquisition.** No scrapers against Instagram, TikTok, or LinkedIn. Those surfaces are manual-curation inputs for the human `pulse_editions` desk, not automated ingestion. See `03-acquisition-methods.md`.
4. **Keep the two systems separate.** The automated feed and the hand-authored `pulse_editions` remain distinct. Periodic, analytical sources (for example the Nielsen and Selig reports) are flagged for the human desk, not the automated feed.
5. **Australian English, no fabricated data.** Match the existing house style. Never invent figures, quotes, or feed paths.

## Definition of done

- One new additive migration, named to the existing convention (`YYYYMMDDHHMMSS_intelligence_feed_expansion.sql` or similar), that inserts the verified new `news_sources` and `tracked_entities` rows.
- The migration applies cleanly and is idempotent.
- A short run report: how many sources and entities were added, and a list of any feeds skipped with the reason.

## Integration notes (optional follow-ups, not required for the core task)

- If the ingester does not already set `media_type` per source type, YouTube and podcast feeds will land as `article`. Either add a per-source `media_type` default on those new rows, or handle the mapping as a small follow-up in the ingester. Keep the core migration to data insertion.
- Music-analytics and streaming APIs (Chartmetric, Spotify) are instrumentation, not feeds. They are documented in `03-acquisition-methods.md` and are a separate build, not part of this migration.

## Companion files

- `01-source-catalogue.md` — the build-ready list of feeds to add, grouped by domain, with region, suggested weight, media type, access, and notes.
- `02-entity-seed-list.md` — the people, companies, and themes to seed into `tracked_entities`.
- `03-acquisition-methods.md` — technical feasibility and acquisition guidance, including feed discovery, Google News query patterns, and the social-platform route-around.
