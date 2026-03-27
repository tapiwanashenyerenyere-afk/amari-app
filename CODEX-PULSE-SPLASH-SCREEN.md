# AMARI Pulse + Splash Screen — Codex Handoff

## Reference Designs
- Splash prototype: `amari-splash-v9-prototype.html` (Version 1: Emblem + Orbs — chosen)
- Pulse prototype: `amari-pulse-v9-prototype.html`
- Serve locally: `python -m http.server 9124 --directory C:\Users\tapiw\Downloads`

---

## 1. Splash Screen — "Emblem + Orbs" (Final)

### The Feel
The splash should feel like you're entering a living, breathing space — not just a logo on a screen. The AMARI emblem emerges from darkness surrounded by ambient light that shifts and pulses. It's an experience, not a loading screen. Think: the moment before a curtain rises.

### Animation Sequence (staggered, spring physics)
1. **0ms** — Emblem scales in from 0.85→1.0 with spring physics (damping:15, stiffness:150), 1.2s
2. **500ms** — "A M A R I" wordmark fades in, letter-spacing contracts 20px→12px, 1.5s
3. **1000ms** — Vertical gold line grows from 0→40px height, 0.8s
4. **1400ms** — "For the *Alchemists*" fades up from 10px below, 0.8s
5. **1800ms** — Small emblem watermark (32px, 12% opacity) fades in below tagline, 0.8s
6. **~3000ms** — Entire splash transitions to the Pulse screen

### Background — Dynamic, Not Static
The background is NOT flat black. It's alive:

**Ambient mesh** — Three overlapping radial gradients (gold, burgundy, teal) that slowly rotate and scale on a 12s infinite cycle. Creates shifting pools of warm color.
```
radial-gradient(ellipse 60% 50% at 20% 30%, rgba(201,169,98,0.06))
radial-gradient(ellipse 50% 60% at 80% 70%, rgba(114,47,55,0.05))
radial-gradient(ellipse 70% 40% at 50% 90%, rgba(80,160,140,0.03))
```

**Breathing orbs** — Four radial gradient circles at different positions, sizes, and speeds:
- Gold orb: 400px, center, 4s breathe cycle
- Burgundy orb: 300px, center, 5s breathe cycle (1s delay)
- Teal orb: 200px, lower-left, 6s breathe cycle (2s delay)
- Gold orb 2: 150px, upper-right, 7s breathe cycle (0.5s delay)

Each orb scales between 1.0→1.15→1.0 and fades 0.7→1.0→0.7 in a continuous loop.

**Particle lines** — 5 thin vertical 1px lines with gold gradient that float upward through the screen at different speeds (7-11s duration, staggered delays). Creates subtle motion depth.

**Grain texture** — SVG noise at 3% opacity on top of everything.

### Visual Elements
- **Background**: `#0A0A0A`
- **Emblem**: The actual `amari-emblem.png` from `assets/images/` — 90px, rounded 20px, with glow shadow `0 0 50px rgba(201,169,98,0.06)`
- **Wordmark**: Plus Jakarta Sans 18px 700, letter-spacing 12px, 80% white, uppercase
- **Gold line**: 1px wide, 40px tall, vertical gradient `transparent → gold → transparent`
- **Tagline**: "For the" in 300 weight 35% white + "*Alchemists*" in 300 weight italic gold
- **Emblem watermark**: 32px, rounded 8px, 12% opacity — below the tagline as a bookend
- **NO "Australia's Black Diaspora" text** — removed

### Transition to Pulse
After ~3 seconds, transition to the Pulse screen. Use your best judgement on implementation — cross-dissolve, fade through black, or coordinate with Expo SplashScreen API. The key feeling: the darkness opens up into the warm bone Pulse screen.

### The Emblem is Sacred
Always use the actual `amari-emblem.png` (600x599px source at `assets/images/amari-emblem.png`). Never recreate, simplify, or substitute the emblem.

---

## 2. Pulse Screen (Home)

### The Feel
The Pulse is your daily window into AMARI. It should feel like opening a premium magazine that knows you — your next event, member wins that matter to you, projects being built near you. Not a dashboard, not a social feed. A curated, intentional experience.

### Layout (top to bottom)
```
┌──────────────────────────────────┐
│ Good afternoon, Jeremy  [My Card]│
│ Explore                          │
│                                  │
│ ┌──────────────────────────────┐ │
│ │  Hero story (swipeable)      │ │
│ └──────────────────────────────┘ │
│         ● ○                      │
│                                  │
│ ┌──────────┐ ┌──────────┐      │
│ │ Next     │ │ On the   │      │
│ │ Event    │ │ Map      │      │
│ └──────────┘ └──────────┘      │
│                                  │
│ The Pulse            Archive →  │
│ [Article] [Article] [Article]   │
│                                  │
│ Pulse Events Aligned Corridor Me│
└──────────────────────────────────┘
```

### My Card Button (Top Right)
**What it is:** A dark charcoal pill with gold avatar circle, "My Card" text, and a pulsing gold dot. Always visible at the top of the Pulse screen. One tap opens your membership card with QR code.

**Why it's there:** At events, members need instant access to their scannable card. No digging through tabs. It's always right there.

**What happens on tap:**
- Full-screen dark overlay fades in (97% black, 400ms)
- Membership card animates in (scale 0.8→1.0, spring physics) — identical design to Profile card:
  - Shimmer sweep animation
  - Grain texture at 4% opacity
  - Gold radial glow top-right
  - AMARI brand + PLATINUM tier badge
  - Gold gradient avatar with initials
  - Member name + location
  - Member ID in mono
  - Gold baseline
- QR code appears below (scale 0.9→1.0, 200ms delay):
  - **Pure white `#FFFFFF` background** — critical for scanner readability
  - **200x200px container, 22px internal padding** (quiet zone)
  - QR generated from member UUID: `https://amari.app/member/{uuid}`
  - **AMARI emblem sits BELOW the QR, not inside it** — never inside
  - Member ID repeated in mono below QR
- Wallet buttons: Apple Wallet + Google Wallet (frosted glass, `rgba(255,255,255,0.06)` bg)
- "Tap anywhere to close" at bottom

**QR best practices (for Codex to consider):**
- Auto-max screen brightness when popup opens
- Prevent screen sleep while QR is visible
- Use Level H error correction when generating QR
- Use `react-native-qrcode-svg` for cross-platform rendering

### Hero Stories (Swipeable)
**What they are:** Member wins and community news as bold dark cards you can swipe through.

**How they look:**
- Dark gradient cards (same visual language as Aligned explore tiles and Event cards)
- Each card: badge ("NEW THIS WEEK" / "FEATURED"), category label, bold title, excerpt, date, "Read →" in gold
- Horizontally swipeable (scroll snap or pager view)
- Scroll dots below: active = gold pill (18px wide), inactive = 6px circle

**What happens on tap:**
- Full article detail slides up as an overlay
- Back arrow top-left
- Cover image area (dark placeholder if no image)
- Category label in gold mono
- Bold headline
- Date in mono
- Full article body text
- Divider line
- "Matched to **finance** and **Melbourne** in your profile" — personalized recommendation

### Bridge Tiles
**What they are:** Two dark cards that connect the home screen to Events and Aligned without being widgets. They're content, not navigation.

**Left tile — Next Event:**
- Dark warm gradient
- Big bold date number (28px)
- Month in gold mono
- Event name
- Dress code
- Tapping → navigates to Events tab

**Right tile — On the Map:**
- Dark blue-teal gradient
- Project count nearby (big number)
- "3 new this week →" in gold
- Tapping → navigates to Aligned tab (Map view)

### The Pulse Feed
**What it is:** A clean scrollable list of community news and member achievements.

**How each row looks:**
- Category label (mono, tracked uppercase, 30% black)
- Bold title (sans 16px 700)
- Description (sans 12px, 45% black) — not all rows need this
- Date (mono 9px, 25% black)
- Thumbnail image on the right (80px, rounded 12px, dark charcoal with faint letter if no image)

**Tapping a row** → opens the same article detail overlay as hero stories.

### Article Content — Written for Operators
This is important context for whoever writes the Pulse content:

Stories have **two layers**. The surface story is about leadership, community, culture. But the deeper story — the one operators see — is about deal-making, capital movement, access, and strategic positioning.

Example: "Jamal Elsheikh Brokers Anti-Racism Partnership Between Melbourne's A-League Rivals" — surface story is anti-racism. Operator reading: he just brokered a deal between two rival organizations and positioned himself as the trusted intermediary.

**Design signals for this:**
- The "Matched to **finance** and **Melbourne** in your profile" footer connects the story to the reader's interests — operators notice this pattern
- Category labels hint at the domain (Business, Policy, Capital)
- Don't spell out the operator angle — let keen readers connect the dots

---

## 3. Corridor Tab — "Coming Soon"

The Corridor tab in the bottom navigation should show a "SOON" label beneath the icon. The tab is tappable but shows a simple coming soon state:
- Center the screen with the text "Corridor" in bold sans
- Subtitle: "Exclusive opportunities for AMARI members"
- "Coming soon" in mono tracked text below
- AMARI emblem watermark at bottom (same as other screens)

Do NOT build any Corridor functionality — just the placeholder.

---

## 4. Tab Bar — CRITICAL

**Do NOT change the existing tab bar icons.** Keep the original icons/symbols from the current codebase:
- Pulse: sun/starburst
- Events: calendar
- Aligned: Y-fork
- Corridor: pin marker (add "SOON" label beneath)
- Me: person silhouette

The HTML prototypes use placeholder SVG icons — those are NOT the correct ones. Use whatever is already in the codebase.

---

## 5. Font Rules (consistent across entire app)

Plus Jakarta Sans for everything. JetBrains Mono for labels/meta. No Playfair Display anywhere.

### Splash
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Wordmark "A M A R I" | sans | 18px | 700 | 80% white |
| Tagline "For the" | sans | 16px | 300 | 35% white |
| Tagline "Alchemists" | sans | 16px | 300 italic | gold |

### Pulse
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Greeting | sans | 13px | 400 | 40% black |
| "Explore" title | sans | 32px | 700 | black |
| My Card button | sans | 11px | 600 | white |
| Hero badge | mono | 8px | 500 | gold |
| Hero category | mono | 9px | 500 | 40% white |
| Hero title | sans | 24px | 700 | white |
| Hero excerpt | sans | 13px | 400 | 45% white |
| "Read →" | sans | 13px | 600 | gold |
| Bridge date | sans | 28px | 700 | white |
| Bridge month | mono | 9px | 500 | gold |
| Feed title | sans | 16px | 700 | black |
| Feed description | sans | 12px | 400 | 45% black |
| Feed date | mono | 9px | 400 | 25% black |
| Section title | sans | 18px | 700 | black |
| "Archive →" | sans | 12px | 600 | gold-dark |

---

## 6. Standing Rules (Apply to ALL Screens)

These rules come from the entire session and apply everywhere in the app:

1. **No job roles/titles visible** — AMARI is about what people are building, not their corporate titles. Never show roles to other members on any screen.

2. **No serif fonts** — All `typography.serif` references now map to Plus Jakarta Sans at bold weights. No Playfair Display anywhere.

3. **No fake data** — Real data or honest empty states. Never invent partnerships, people, or events.

4. **The AMARI emblem is sacred** — Always use the actual PNG from `assets/images/amari-emblem.png`. Never recreate.

5. **Tab bar icons untouched** — Keep existing bottom nav icons from codebase. Prototypes use placeholders.

6. **QR code: white bg, no logo inside** — Pure `#FFFFFF` background, generous quiet zone, emblem goes BELOW the QR.

7. **Corridor = "Coming Soon"** — Show "SOON" label, don't build the feature.

8. **Contact feature** — When members can contact each other, use mailto: with auto-filled email + subject. Always show the community guideline: "All communication between members must reflect AMARI values of respect, integrity, and mutual benefit. Behaviour inconsistent with these values may result in removal from the community."

9. **Bookmarks → "Save to Interested In"** — Saved items go to Profile → Interested In panel. Use bookmark icon with visible border, clear saved/unsaved states.

10. **Text readability** — No `font-weight: 300` for body text (use 400 minimum). No `rgba` below 0.4 for any text that needs to be read. Descriptions at 0.45-0.6, meta at 0.35-0.4 minimum.

---

## 7. Files in Project

### Handoff Docs (read ALL before building)
| File | Covers |
|------|--------|
| `CODEX-PROFILE-REDESIGN.md` | Profile screen, membership card, QR popup, project tiles |
| `CODEX-ALIGNED-SCREEN.md` | Aligned screen, Mapbox map, font migration, privacy rules |
| `CODEX-EVENTS-SCREEN.md` | Events screen, event types, registration links, tier gating |
| `CODEX-PULSE-SPLASH-SCREEN.md` | This file — Pulse home + Splash screen |

### Interactive Prototypes (open in browser to see the design)
| File | Screen |
|------|--------|
| `amari-aligned-v9-prototype.html` | Aligned — Board/Map/Interests with real geographic maps |
| `amari-profile-v9-prototype.html` | Profile — Card, projects, interested in, account |
| `amari-events-v9-prototype.html` | Events — Bold dark cards, registration links |
| `amari-pulse-v9-prototype.html` | Pulse — Hero stories, bridge tiles, news feed, card popup |
| `amari-splash-v9-prototype.html` | Splash — Emblem + orbs + dynamic background |

### Database Migrations (already created)
| File | What |
|------|------|
| `supabase/migrations/20260326000001_map_feature.sql` | PostGIS, region_centroids, projects, cache tables, RPCs |
| `supabase/migrations/20260326000002_map_refresh_rpc.sql` | Weekly refresh function |

### Map Plan
| File | What |
|------|------|
| `C:\Users\tapiw\Downloads\AMARI_Map_Plan_v2.md` | Full technical plan for map feature |
