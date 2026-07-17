# Entity seed list

Rows to add to `tracked_entities`. The ingester rotates through entities and runs a per-entity Google News query, then merges rediscovered URLs onto existing rows via the append path, so entity coverage stacks the follow boost without duplicating articles.

**Exclusions.** Do not re-seed the two themes already present ("Africa-Australia trade corridor", "African diaspora investment") or any entity already in the table.

**Type** is one of `person`, `company`, or `theme`, matching the existing schema. Keep the query specific enough to avoid noise; where a name is common, the ingester query should be scoped (for example add "founder", "Africa", or the firm name).

**De-noising principle.** Track institutions, corridor figures, and emerging or diaspora-relevant names. Do not seed global pop mega-stars whose names generate high-volume, low-signal celebrity coverage; their commercially relevant moves surface through the music publications and charts instead.

## Companies and institutions

| Entity | Type | Rationale |
|---|---|---|
| Africa: The Big Deal | company | African startup funding data; deal-level signal |
| Briter Bridges | company | African startup and investment data |
| AVCA | company | Continental PE and VC body |
| Catalyst Fund | company | Active early-stage African investor |
| Impact X Capital | company | UK Black-led VC |
| Cornerstone Partners | company | UK diverse-founder VC |
| Ada Ventures | company | UK VC backing under-reached founders |
| Black Seed VC | company | UK Black-founder VC |
| Zeal Capital Partners | company | US inclusive-investing VC |
| Harlem Capital | company | US diverse-founder VC and data |
| BLCK VC | company | US Black investor community |
| BKR Capital | company | Canada Black-led VC |
| The Plug (tpinsights) | company | US Black innovation-economy intelligence |
| digitalundivided | company | US data on Black and Latina founders |
| Colorintech | company | UK Black-tech non-profit and Black Tech Fest |
| Foundervine | company | UK accelerator for under-reached founders |
| Culture Genesis | company | US diverse creator video network |
| Australia Africa Business Council | company | Corridor trade body |
| African Australian Chamber of Commerce | company | Corridor business body |

## People

| Entity | Type | Rationale |
|---|---|---|
| Maxime Bayen | person | Africa: The Big Deal; African funding data |
| Eric Collins | person | Impact X Capital; UK diverse capital |
| Izzy Obeng | person | Foundervine; UK founder pipeline |
| Karl Lokko | person | Black Seed VC; UK capital signal |
| Sherrell Dorsey | person | The Plug; US innovation-economy data |
| Tokini Peterside-Schwebig | person | Art X Lagos founder |
| Touria El Glaoui | person | 1-54 art fair founder |
| Grace Ladoja | person | Homecoming Festival; diaspora-creative crossover |
| Genesis Owusu | person | Leading African-Australian artist |
| Sampa the Great | person | Leading African-Australian artist |

## Themes and events

| Entity | Type | Rationale |
|---|---|---|
| Homecoming Festival Lagos | theme | Diaspora-creative crossover, annual |
| Art X Lagos | theme | West African art fair, annual |
| 1-54 Contemporary African Art Fair | theme | Diaspora art market, multi-city |
| Black Tech Fest | theme | UK Black-tech convening |
| Africa Down Under | theme | Australia-Africa business and resources |
| Move My Way (festival) | theme | Australian Afro-jazz and diaspora crossover |
| BlackStar Film Festival | theme | US high-curation diaspora film |
| Essence Festival | theme | US culture, music and business |
| AGOA | theme | US-Africa trade framework |
| AfCFTA | theme | Continental free-trade area |
| Prosper Africa | theme | US-Africa commercial initiative |
| Afrobeats and Amapiano industry | theme | Music-sector commercial signal |
| Grammy Best African Music Performance | theme | Institutional recognition of African music |

## Notes

- Event themes double as a rolling calendar: their line-ups, delegates, and speakers are named-entity harvests. When a festival or fair publishes a programme, extract the artists, galleries, films, or firms and add the material ones as their own entities. See `03-acquisition-methods.md`.
- Powerlist and the Black British Business Awards are entity factories: their annual lists are ready-made sets of names to seed. Add the material figures rather than the list as a single entity.
