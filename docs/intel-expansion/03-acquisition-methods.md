# Acquisition methods and technical feasibility

Reference for how each source type is actually captured, ordered from cheapest and most reliable to hardest. All methods preserve the headline, snippet, image, and link only posture; none republish full text.

## 1. RSS and Atom (the backbone)

Most news sites, all WordPress installs (`/feed/`), and every Substack (`/feed`) expose feeds. The ingester already handles both RSS and Atom. For each catalogue row marked `(verify)`, fetch and confirm the feed returns valid XML before insertion. Test in order: `/feed`, `/feed/`, `/rss`, `/atom.xml`, `/feed.xml`. If none resolve, fall back to a Google News query for the publication, or skip and log. Never insert an unconfirmed feed URL.

## 2. Google News RSS search queries

The existing workhorse, free, and the right tool for any topic or publication without a clean native feed, and for per-entity tracking. Pattern, localised to Australia:

```
https://news.google.com/rss/search?q={QUERY}&hl=en-AU&gl=AU&ceid=AU:en
```

URL-encode the query. Use quotes for phrases and boolean OR for variants, for example `"African Australian" (founder OR entrepreneur OR business)`. This is how the corridor and entity coverage is built without a paid search API.

## 3. Newsletter to RSS bridges

Several high-signal sources are newsletter-first (The Big Deal has a public Substack; The Plug, Semafor Africa, and the TechCabal Next Wave are newsletter-led). Substacks expose `/feed` directly. For non-Substack newsletters, subscribe from a dedicated inbox and convert to an Atom feed with Kill the Newsletter or an equivalent, then ingest the generated feed. You are a legitimate subscriber, and only the headline and link are stored.

## 4. YouTube channel feeds

Every channel exposes an Atom feed, which ingests through the existing path:

```
https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}
```

Resolve `CHANNEL_ID` from the channel page source or a channel-ID lookup; the handle alone is not enough. Set `media_type` to `video` on these rows. This is the clean, terms-compliant route to the video slot for organisations that are otherwise Instagram-first (AfroTech, Black Tech Fest, Homecoming, Art X Lagos).

## 5. Podcast feeds

Every podcast is an RSS feed by definition. Subscribe to the feed URL directly and set `media_type` to `audio`. Underused and high-signal for founder interviews and scene coverage.

## 6. Music-analytics and streaming APIs (instrumentation, separate build)

This is the quantitative edge for the creative domain, and it is not a `news_sources` feed.

- **Chartmetric, Songstats, or Viberate**: artist-level streaming and social-momentum data through paid APIs. A weekly pull against a diaspora-artist watchlist spots a breakout before the press. Fully within terms of service.
- **Spotify Web API**: official and free; track new releases and editorial playlists such as RADAR Africa and Fresh Finds.

Document as a follow-up instrumentation task feeding the `pulse_editions` desk or a future signal table, not the automated news feed.

## 7. Art-market and event-calendar monitoring

Fairs, festivals, and auction houses do not offer feeds. Monitor exhibitor lists, festival line-ups, and results pages, and harvest named artists, galleries, films, and firms as entities that then flow into Google News entity queries. This turns a fixed annual calendar into a rolling entity list. For ticketed events, a known organiser's events can be pulled by organisation ID where the platform still supports it; Eventbrite removed its public cross-platform search in 2019, so track specific organisers, not the whole platform.

## 8. LinkedIn

Hard. No official API covers third-party pages, groups, or creator posts, and scraping breaches the User Agreement. Route around it: follow the Substack or newsletter versions that most thought leaders also publish, and run a weekly human-curation pass over a saved list of people and pages into the `pulse_editions` desk. LinkedIn is a manual surface, not an automated feed.

## 9. Instagram and TikTok

Hardest, and where creative culture lives first. Neither offers a clean, terms-compliant route to arbitrary public content in 2026. Instagram's official API reaches only your own account plus limited public fields on other business accounts through business discovery. TikTok's Research API is restricted to vetted researchers and does not serve a product, and its posting and display APIs cover only authorised accounts. Third-party scrapers breach both platforms' terms and sit against a consent-first posture, so they are excluded. The workable response is the route-around: almost every artist, gallery, festival, and creator that matters also publishes to YouTube, a newsletter, a podcast, or their own site, all of which ingest cleanly. Treat Instagram and TikTok as manual-curation inputs for the human desk, and let the analytics platforms in section 6 carry the quantitative early signal.

## 10. Partnerships (highest value, out of scope for the migration)

A small number of reciprocal content or data arrangements would give permissioned, structured feeds no scraper can match, aligned with the consent-first posture: Africa Media Australia locally, The Big Deal or Briter for African funding data, Colorintech or Black Tech Fest for the United Kingdom, and Blavity or The Plug for North America. Noted here as the strategic ceiling; it belongs to the `pulse_editions` and partnerships track, not this build.

## Guardrails recap

- Verify before inserting; skip and log on failure; never fabricate a feed URL.
- Additive only; idempotent inserts; no edits to existing rows, weights, cron, budget, or taxonomy.
- No terms-breaching scrapers.
- Headline, snippet, image, and link only; never full text.
