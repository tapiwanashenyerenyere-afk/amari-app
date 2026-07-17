# Feed verification — 17 July 2026

Final pre-migration verification ran at `2026-07-17T09:31:06.364Z` with the production `fast-xml-parser` contract, the production user agent, a 15-second timeout, and a five-worker pool. All 51 selected URLs returned HTTP 200 and at least one parseable RSS/Atom item. `Newest item` is the greatest valid item timestamp in the parsed batch, not feed order.

The restricted production comparison contained 12 `news_sources` and 20 `tracked_entities`. It found no exact `feed_url`, `(kind, name)`, case-folded name, or canonical-redirect collision. The migration therefore has clean-target deltas of `+51` sources and `+45` entities; deployment must still report actual inserted/skipped counts.

| Source | Requested URL | Final URL | HTTP | Content type | Parsed | Newest item | Route |
|---|---|---|---:|---|---:|---|---|
| Africa: The Big Deal | `https://thebigdeal.substack.com/feed` | `https://thebigdeal.substack.com/feed` | 200 | `application/xml; charset=utf-8` | 20 | `2026-07-14T07:28:29.000Z` | Direct |
| Rest of World | `https://restofworld.org/feed/latest/` | `https://restofworld.org/feed/latest/` | 200 | `application/xml; charset=utf-8` | 12 | `2026-07-16T10:00:00.000Z` | Direct |
| The Africa Report | `https://www.theafricareport.com/feed/` | `https://www.theafricareport.com/feed/` | 200 | `application/xml` | 10 | `2026-07-17T07:00:00.000Z` | Direct |
| Africa Media Australia | `https://africamediaaustralia.com.au/feed/` | `https://africamediaaustralia.com.au/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-02T10:33:53.000Z` | Direct |
| Extend Ventures | `https://extendventures.substack.com/feed` | `https://extendventures.substack.com/feed` | 200 | `application/xml; charset=utf-8` | 15 | `2023-12-22T13:03:01.000Z` | Direct |
| Blavity News | `https://blavity.com/rss.xml` | `https://blavity.com/rss.xml` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-16T22:10:21.000Z` | Direct |
| Travel Noire | `https://travelnoire.com/rss.xml` | `https://travelnoire.com/rss.xml` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-16T22:34:26.000Z` | Direct |
| Capital B | `https://capitalbnews.org/feed/` | `https://capitalbnews.org/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-16T20:45:00.000Z` | Direct |
| Andscape | `https://andscape.com/feed/` | `https://andscape.com/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 9 | `2026-07-16T18:30:14.000Z` | Direct |
| Harlem Capital | `https://harlem.capital/feed/` | `https://harlem.capital/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-16T18:45:31.000Z` | Direct |
| The NATIVE | `https://thenativemag.com/feed/` | `https://thenativemag.com/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-15T13:20:54.000Z` | Direct |
| Afrobeats Intelligence | `https://afrobeatsintelligence.substack.com/feed` | `https://afrobeatsintelligence.substack.com/feed` | 200 | `application/xml; charset=utf-8` | 20 | `2026-07-13T14:06:38.000Z` | Direct |
| Rolling Stone Africa | `https://rollingstoneafrica.com/feed/` | `https://rollingstoneafrica.com/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-16T17:12:38.000Z` | Direct |
| NotJustOk | `https://notjustok.com/feed/` | `https://notjustok.com/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 16 | `2026-07-17T09:21:06.000Z` | Direct |
| Afrocritik | `https://afrocritik.com/feed/` | `https://afrocritik.com/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-17T09:06:30.000Z` | Direct |
| GRM Daily | `https://grmdaily.com/feed/` | `https://grmdaily.com/feed/` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-06-29T13:20:49.000Z` | Direct |
| GUAP | `https://www.guap.co/feed` | `https://www.guap.co/feed` | 200 | `application/xml; charset=utf-8` | 20 | `2026-07-10T11:03:45.000Z` | Direct |
| The FADER | `https://www.thefader.com/feed.rss` | `https://www.thefader.com/feed.rss` | 200 | `application/rss+xml; charset=utf-8` | 20 | `2026-07-16T21:39:39.000Z` | Direct |
| Artnet News — Art World | `https://news.artnet.com/art-world/feed` | `https://news.artnet.com/art-world/feed` | 200 | `application/rss+xml; charset=UTF-8` | 10 | `2026-07-15T16:51:23.000Z` | Direct |
| Artsy Editorial | `https://www.artsy.net/rss/news` | `https://www.artsy.net/rss/news` | 200 | `application/rss+xml; charset=utf-8` | 25 | `2026-07-16T19:21:41.000Z` | Direct |
| MarkLives | `https://www.marklives.com/feed/` | `https://www.marklives.com/feed/` | 200 | `application/xml` | 20 | `2026-07-15T14:00:00.000Z` | Direct |
| Semafor Africa | `https://news.google.com/rss/search?q=%22Semafor%20Africa%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-16T14:16:00.000Z` | Google News AU |
| AVCA | `https://news.google.com/rss/search?q=%22AVCA%22%20Africa%20private%20equity&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-05-07T07:00:00.000Z` | Google News AU |
| Briter Bridges | `https://news.google.com/rss/search?q=%22Briter%20Bridges%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-15T14:57:15.000Z` | Google News AU |
| SBS African affairs | `https://news.google.com/rss/search?q=site%3Asbs.com.au%2Fnews%20Africa&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-17T09:15:13.000Z` | Google News AU |
| The Conversation African Australians | `https://news.google.com/rss/search?q=site%3Atheconversation.com%20%22African%20Australians%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-11T13:29:32.000Z` | Google News AU |
| Australia Africa Business Council | `https://news.google.com/rss/search?q=%22Australia%20Africa%20Business%20Council%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 2 | `2018-01-26T08:00:00.000Z` | Google News AU |
| Africa Down Under | `https://news.google.com/rss/search?q=%22Africa%20Down%20Under%22%20Perth&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 17 | `2026-01-17T08:00:00.000Z` | Google News AU |
| DFAT Africa | `https://news.google.com/rss/search?q=site%3Adfat.gov.au%20Africa&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-03-31T07:00:00.000Z` | Google News AU |
| AGAAR | `https://news.google.com/rss/search?q=%22Advisory%20Group%20on%20Australia-Africa%20Relations%22%20OR%20AGAAR&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-01-12T08:00:00.000Z` | Google News AU |
| Australia–Africa trade | `https://news.google.com/rss/search?q=%22Australia%20Africa%20trade%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 3 | `2025-11-05T08:00:00.000Z` | Google News AU |
| Black Tech Fest | `https://news.google.com/rss/search?q=%22Black%20Tech%20Fest%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 10 | `2025-10-10T07:00:00.000Z` | Google News AU |
| Colorintech | `https://news.google.com/rss/search?q=%22Colorintech%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 9 | `2025-01-09T08:00:00.000Z` | Google News AU |
| British Business Bank diversity | `https://news.google.com/rss/search?q=site%3Abritish-business-bank.co.uk%20diversity&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2025-10-24T11:59:34.000Z` | Google News AU |
| Shadow and Act | `https://news.google.com/rss/search?q=%22Shadow%20and%20Act%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-04-03T07:00:00.000Z` | Google News AU |
| 21Ninety | `https://news.google.com/rss/search?q=%2221Ninety%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-03-31T07:00:00.000Z` | Google News AU |
| BLCK VC | `https://news.google.com/rss/search?q=%22BLCK%20VC%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 21 | `2026-01-01T08:00:00.000Z` | Google News AU |
| BKR Capital | `https://news.google.com/rss/search?q=%22BKR%20Capital%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 24 | `2026-07-09T01:42:00.000Z` | Google News AU |
| Black Founders Network | `https://news.google.com/rss/search?q=%22Black%20Founders%20Network%22%20Canada&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 15 | `2026-04-22T07:00:00.000Z` | Google News AU |
| BBPA | `https://news.google.com/rss/search?q=%22Black%20Business%20and%20Professional%20Association%22%20Canada&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2024-12-19T08:00:00.000Z` | Google News AU |
| OkayAfrica | `https://news.google.com/rss/search?q=site%3Aokayafrica.com&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-16T18:17:58.000Z` | Google News AU |
| Trench | `https://news.google.com/rss/search?q=site%3Atrenchtrenchtrench.com&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-04-01T07:00:00.000Z` | Google News AU |
| Mixtape Madness | `https://news.google.com/rss/search?q=%22Mixtape%20Madness%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-17T09:21:37.000Z` | Google News AU |
| Complex | `https://news.google.com/rss/search?q=site%3Acomplex.com%20music&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-16T19:19:51.000Z` | Google News AU |
| Okayplayer | `https://news.google.com/rss/search?q=site%3Aokayplayer.com&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-15T15:30:37.000Z` | Google News AU |
| The Music | `https://news.google.com/rss/search?q=site%3Athemusic.com.au%20music&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-17T02:55:55.000Z` | Google News AU |
| triple j Unearthed | `https://news.google.com/rss/search?q=%22triple%20j%20Unearthed%22&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-15T00:54:42.000Z` | Google News AU |
| Contemporary And | `https://news.google.com/rss/search?q=%22Contemporary%20And%22%20African%20art&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-05-29T13:51:37.000Z` | Google News AU |
| The Drum | `https://news.google.com/rss/search?q=site%3Athedrum.com&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-16T12:20:46.000Z` | Google News AU |
| Campaign | `https://news.google.com/rss/search?q=site%3Acampaignlive.co.uk%20OR%20site%3Acampaignlive.com&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-16T10:08:21.000Z` | Google News AU |
| Little Black Book | `https://news.google.com/rss/search?q=site%3Albbonline.com&hl=en-AU&gl=AU&ceid=AU:en` | same | 200 | `application/xml; charset=utf-8` | 25 | `2026-07-17T09:24:58.000Z` | Google News AU |

## Canonical redirects and rejected endpoint candidates

- Blavity `/feed` and `/feed/`: HTTP 200 `text/html`, zero parsed; `/rss` redirected to the selected `/rss.xml`.
- Travel Noire `/feed` and `/feed/`: HTTP 404 `text/html`, zero parsed; `/rss` redirected to the selected `/rss.xml`.
- The FADER `/rss`: HTTP 404 `text/html`, zero parsed; `/feed` redirected to the selected `/feed.rss`.
- Afrocritik `https://www.afrocritik.com/feed/` redirected to the selected non-`www` URL.
- GUAP `https://guap.co/feed/` redirected to the selected `https://www.guap.co/feed` URL.

## Specification routes intentionally excluded

- TechCabal Next Wave and The Plug newsletter bridges: newsletter bridge work is excluded; The Plug remains an entity.
- Afreximbank/AfCFTA, Diversity VC/UK Diversity Data Alliance, Black Ballad, digitalundivided/ProjectDiane, Prosper Africa/US-Africa Business Center, and TurnTable Charts: no approved direct feed; retained as manual, desk, data, or entity routes.
- Powerlist, Black British Business Awards, ADCOLOR, 1-54, Art X Lagos, Investec Cape Town Art Fair, Lagos Biennial, BlackStar Film Festival, ABFF, and Blackhouse: entity/calendar routes, not standalone feeds.
- Nielsen Diverse Intelligence Series and the Selig Center Multicultural Economy: periodic reports assigned to the human Pulse desk.
- Culture Genesis and Screen Africa: not in the 17 July approved verified source set; no unverified URL was inserted.
- Extra corridor queries for “African Australian founder” and “African Australian business”: excluded to avoid overlapping the existing baseline query; the approved Australia–Africa trade query is the only added corridor search.
