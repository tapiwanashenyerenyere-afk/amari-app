# Source catalogue: additive feeds

Feeds to add to `news_sources`. This list excludes everything already seeded (TechCabal, Disrupt Africa, How We Made It In Africa, African Business, Ventures Africa, Lionesses of Africa, Black Enterprise, AfroTech, The Voice, SmartCompany, Startup Daily, and the existing "African Australian" Google News query).

**Column notes.** `Region` and `Topics` are advisory metadata for weighting and QA; the classifier assigns the actual region and topic tags per article at enrichment. `Wt` is a suggested `default_weight` relative to the existing baseline of 1.0 (the current top source, the African-Australian query, sits at 1.2); treat these as a light editorial thumb, since the classifier relevance score does the heavy lifting. `Feed` gives the canonical property and the strategy: a direct RSS or Atom URL, a Google News query, or a bridge. `(verify)` means the exact feed URL must be fetched and confirmed before insertion. Regions use the four existing tags: Australia, United Kingdom, Africa, Americas (Americas covers the United States and Canada).

---

## Section A: Technology, startups, capital, policy and trade

### Pan-African and diaspora

| Source | Feed | Region | Topics | Wt | Type | Access |
|---|---|---|---|---|---|---|
| Africa: The Big Deal | `thebigdeal.substack.com/feed` (confirmed) | Africa | Capital & Finance, Entrepreneurship | 1.25 | article | Easy |
| Semafor Africa | semafor.com/vertical/africa (verify RSS or bridge) | Africa, Americas | Policy, Capital & Finance, Technology | 1.15 | article | Easy |
| Rest of World | restofworld.org (verify `/feed`) | Africa, Americas, UK | Technology, Entrepreneurship | 1.15 | article | Easy |
| TechCabal, The Next Wave (newsletter) | bridge from the Next Wave newsletter | Africa | Technology, Capital & Finance | 1.10 | editorial | Easy |
| AVCA (African PE and VC Association) | avca.africa (verify RSS, else manual) | Africa | Capital & Finance, Policy | 1.10 | article | Medium |
| Briter Bridges | briterbridges.com (verify) | Africa | Capital & Finance, Technology | 1.10 | article | Medium |
| The Africa Report | theafricareport.com (verify `/feed`) | Africa | Policy, Capital & Finance | 1.00 | article | Easy |
| Afreximbank research and AfCFTA updates | afreximbank.com, au-afcfta.org (manual or verify) | Africa | Policy | 1.00 | article | Medium |

### Australia (the corridor and community layer)

| Source | Feed | Region | Topics | Wt | Type | Access |
|---|---|---|---|---|---|---|
| Africa Media Australia | africamediaaustralia.com.au (verify `/feed`) | Australia | Entrepreneurship, Culture, Careers & Talent | 1.20 | article | Easy |
| SBS News, African affairs | sbs.com.au topic feed (verify) | Australia | Policy, Culture, Careers & Talent | 1.05 | article | Easy |
| The Conversation, African Australians topic | theconversation.com topic feed (verify) | Australia | Policy, Leadership, Culture | 1.05 | article | Easy |
| Australia Africa Business Council | Google News query + manual | Australia, Africa | Policy, Capital & Finance | 1.15 | article | Medium |
| Africa Down Under (Perth) | Google News query + calendar | Australia, Africa | Capital & Finance, Property & Infrastructure, Policy | 1.10 | article | Easy to follow |
| DFAT Africa and AGAAR | dfat.gov.au (verify RSS, else manual) | Australia, Africa | Policy | 1.05 | article | Medium |
| New corridor queries | Google News: "African Australian founder"; "Australia Africa trade"; "African Australian business" | Australia | (classifier) | 1.20 | article | Easy |

### United Kingdom

| Source | Feed | Region | Topics | Wt | Type | Access |
|---|---|---|---|---|---|---|
| Extend Ventures | `extendventures.substack.com/feed` (confirmed) + extend.vc/reports | UK | Capital & Finance, Entrepreneurship | 1.20 | article | Easy |
| Black Tech Fest and Colorintech | joinbtf.com, colorintech.org; Google News query + calendar | UK | Technology, Entrepreneurship | 1.10 | article | Easy to follow |
| Diversity VC and UK Diversity Data Alliance | diversity.vc (reports, manual) | UK | Capital & Finance, Policy | 1.00 | article | Medium |
| Powerlist (Powerful Media) | powerful-media.co.uk; entity and calendar source | UK | Leadership, Culture | 1.00 | article | Easy |
| Black British Business Awards | thebbbawards.com; entity and calendar source | UK | Entrepreneurship, Leadership | 1.00 | article | Easy |
| Black Ballad | blackballad.co.uk (subscription) | UK | Culture, Careers & Talent | 1.00 | article | Medium |
| British Business Bank, diversity reporting | british-business-bank.co.uk (verify RSS) | UK | Capital & Finance, Policy | 0.95 | article | Easy |

### North America (Americas)

| Source | Feed | Region | Topics | Wt | Type | Access |
|---|---|---|---|---|---|---|
| Blavity News, Shadow and Act, Travel Noire, 21Ninety | blavity.com and sibling sites (verify feeds) | Americas | Technology, Culture, Creative Industries, Careers & Talent | 1.10 | article | Easy |
| The Plug (Sherrell Dorsey) | tpinsights.com (verify cadence and feed or bridge) | Americas | Technology, Capital & Finance | 1.10 | article | Medium |
| Capital B | capitalbnews.org (verify `/feed`) | Americas | Policy, Culture | 1.05 | article | Easy |
| Andscape | andscape.com (verify `/feed`) | Americas | Culture, Creative Industries | 1.00 | article | Easy |
| digitalundivided and ProjectDiane | digitalundivided.com (reports, manual) | Americas | Capital & Finance, Entrepreneurship | 1.05 | article | Medium |
| BLCK VC and Harlem Capital | blckvc.com, harlem.capital (verify) | Americas | Capital & Finance | 1.05 | article | Medium |
| ADCOLOR | adcolor.org; entity and calendar source | Americas | Creative Industries, Careers & Talent | 1.00 | article | Medium |
| Prosper Africa and US-Africa Business Center | prosperafrica.gov, uschamber.com (manual) | Americas, Africa | Policy | 1.00 | article | Medium |
| Canada: BKR Capital, Black Founders Network, BBPA | bkrcapital.com and org sites; Google News query | Americas | Capital & Finance, Entrepreneurship | 1.00 | article | Medium |

---

## Section B: Music

| Source | Feed | Region | Topics | Wt | Type | Access |
|---|---|---|---|---|---|---|
| The NATIVE | thenativemag.com (verify `/feed`) | Africa, UK, Americas | Creative Industries, Culture | 1.20 | article | Easy |
| OkayAfrica | okayafrica.com (verify `/feed`) | Africa, Americas | Culture, Creative Industries | 1.15 | article | Easy |
| Afrobeats Intelligence (Joey Akan) | Substack (verify subdomain) | Africa | Creative Industries, Capital & Finance | 1.10 | editorial | Easy |
| Rolling Stone Africa | rollingstoneafrica.com (verify `/feed`) | Africa | Creative Industries, Culture | 1.05 | article | Easy |
| NotJustOk | notjustok.com (verify `/feed`) | Africa | Creative Industries | 1.00 | article | Easy |
| Afrocritik | afrocritik.com (verify `/feed`) | Africa | Creative Industries, Culture | 1.00 | article | Easy |
| GRM Daily | grmdaily.com (verify `/feed`) | UK | Creative Industries, Culture | 1.05 | article | Easy |
| Trench, GUAP, Mixtape Madness | trenchtrenchtrench.com, guap.co, mixtapemadness.com (verify) | UK | Creative Industries, Culture | 1.00 | article | Medium |
| Complex, The FADER, Okayplayer | complex.com, thefader.com, okayplayer.com (verify) | Americas | Creative Industries, Culture | 0.95 | article | Easy |
| The Music (AU) and Triple J Unearthed | themusic.com.au (verify `/feed`); Unearthed | Australia | Creative Industries | 1.00 | article | Easy |
| TurnTable Charts | turntablecharts.com (data, manual or verify) | Africa | Creative Industries | 1.00 | article | Medium |

Note: the broad US titles (Complex, The FADER) carry weight below baseline on purpose, so they rely on the classifier relevance score and the entity boost rather than flooding the feed.

---

## Section C: Visual arts, film and screen

| Source | Feed | Region | Topics | Wt | Type | Access |
|---|---|---|---|---|---|---|
| Contemporary And (C&) | contemporaryand.com (verify `/feed`) | Africa, UK, Americas | Creative Industries, Culture | 1.10 | article | Easy |
| 1-54 Contemporary African Art Fair | 1-54.com; entity and calendar source | UK, Americas, Africa | Creative Industries | 1.05 | article | Easy to follow |
| Art X Lagos | artxlagos.com; entity and calendar source | Africa | Creative Industries | 1.05 | article | Easy to follow |
| Investec Cape Town Art Fair, Lagos Biennial | investeccapetownartfair.co.za and org sites; calendar | Africa | Creative Industries | 1.00 | article | Medium |
| Screen Africa | screenafrica.com (verify `/feed`) | Africa | Creative Industries | 1.00 | article | Easy |
| BlackStar Film Festival, ABFF, Blackhouse | blackstarfest.org and org sites; entity and calendar | Americas | Creative Industries, Culture | 1.00 | article | Medium |
| Artnet and Artsy, African art editorial | artnet.com, artsy.net (verify section feeds) | Americas, UK | Creative Industries | 0.95 | article | Medium |

---

## Section D: Marketing, advertising and the creator economy

These skew periodic and analytical. Flag the report-based rows for the `pulse_editions` human desk rather than the automated feed.

| Source | Feed | Region | Topics | Wt | Type | Access | Route |
|---|---|---|---|---|---|---|---|
| Nielsen Diverse Intelligence Series | nielsen.com/insights (reports) | Americas, UK | Capital & Finance, Culture, Creative Industries | 1.00 | article | Easy | pulse desk |
| Selig Center, Multicultural Economy | terry.uga.edu (annual report) | Americas | Capital & Finance | 0.95 | article | Easy | pulse desk |
| Culture Genesis | culturegenesis.co (verify) | Americas | Creative Industries | 0.95 | article | Medium | feed |
| The Drum, Campaign, Little Black Book | thedrum.com, lbbonline.com (verify feeds) | UK, Americas | Creative Industries, Leadership | 0.90 | article | Easy | feed |
| Marklives | marklives.com (verify `/feed`) | Africa | Creative Industries, Leadership | 0.95 | article | Easy | feed |

---

## Ingestion notes carried into the migration

- YouTube and podcast feeds for the anchor organisations (AfroTech, Black Tech Fest, Homecoming, Art X Lagos, and similar) are added through `03-acquisition-methods.md` once channel IDs and podcast feed URLs are resolved. They are Atom and RSS respectively and ingest through the existing path; set their `media_type` to `video` or `audio`.
- Any source marked "entity and calendar source" is better served as a `tracked_entities` row than a standalone feed, because the value is the named people and works it produces. See `02-entity-seed-list.md`.
