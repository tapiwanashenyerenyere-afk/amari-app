# AMARI Aligned Screen + Map Feature — Codex Handoff

## Reference Design
The final interactive HTML prototype is at: `C:\Users\tapiw\Downloads\amari-aligned-v9.html`
Serve it locally: `python -m http.server 9124 --directory C:\Users\tapiw\Downloads` then open `http://localhost:9124/amari-aligned-v9.html`

Click through **Board**, **Map**, and **Interests** tabs to see the full experience.

Profile screen prototype: `http://localhost:9124/amari-profile-v9.html`

---

## Overview

Complete rebuild of the Aligned tab from a landing page with entry cards into a **three-view tabbed screen** with:
1. **Board** — Project/Interest entry cards + Notes/Spark/Scanner actions + Recent connections
2. **Map** — Dark luxury Mapbox map with zoom-aware clustering, results sheet, fullscreen expand
3. **Interests** — Clean list of member interests with bookmarks, contact, and category filters

Also includes: **font migration** from editorial serif (Playfair Display) to clean modern sans (Plus Jakarta Sans), and a comprehensive **map data pipeline** with PostGIS, privacy degradation, and weekly refresh.

---

## 1. Font Migration — CRITICAL

### The Change
All serif (`Playfair Display`) usage is replaced with bold sans-serif (`Plus Jakarta Sans`). This applies to the **entire app**, not just the Aligned screen.

### Why
The editorial italic serif felt too magazine-like. The new direction is **LinkedIn/Spotify/Qantas** — clean, modern, accessible, professional networking energy.

### What Changes in `lib/theme.ts`

The `serif` key should now point to Plus Jakarta Sans at heavier weights:

```typescript
export const typography = {
  // Serif is now aliased to sans — no more Playfair Display for titles
  serif: {
    regular: 'PlusJakartaSans_500Medium',
    italic: 'PlusJakartaSans_400Regular_Italic',  // only for water labels on map
    medium: 'PlusJakartaSans_600SemiBold',
    semiBold: 'PlusJakartaSans_700Bold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_700Bold',
  },
  body: {
    light: 'PlusJakartaSans_300Light',
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  geo: {
    regular: 'PlusJakartaSans_500Medium',
    medium: 'PlusJakartaSans_600SemiBold',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_700Bold',
  },
  mono: {
    light: 'JetBrainsMono_300Light',
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
  },
} as const;
```

### Files to Update
- `lib/theme.ts` — Change serif aliases as above
- `app/_layout.tsx` — Can remove Playfair Display font imports (keep Plus Jakarta Sans + JetBrains Mono)
- **Every screen** — No code changes needed since property names (`serif.medium`, `body.regular`) stay the same. The underlying font just changes.
- `app.json` — Can remove `@expo-google-fonts/playfair-display` from dependencies

### Title Style Rules (new)
- Page titles: `font-weight: 700`, no italic, letter-spacing: -0.5px
- Card titles: `font-weight: 700`
- Body text: `font-weight: 400`
- Labels/badges: JetBrains Mono, all-caps, tracked
- NO italic on any title (italic was the old serif style)

---

## 2. Aligned Screen Architecture

### File: `app/(tabs)/aligned/index.tsx`

```
┌──────────────────────────────────┐
│  Aligned                  Search │  ← title (sans 26px 700) + search icon
│                                  │
│  ┌────────┬────────┬──────────┐ │
│  │ Board  │  Map   │Interests │ │  ← ViewToggle segmented control
│  └────────┴────────┴──────────┘ │
│                                  │
│  [Content based on active view]  │
│                                  │
│  Pulse Events Aligned Corridor Me│  ← tab bar
└──────────────────────────────────┘
```

### Components Created (already in codebase)
| File | Purpose |
|------|---------|
| `components/aligned/ViewToggle.tsx` | Board/Map/Interests segmented control |
| `components/aligned/FilterChips.tsx` | Category filter pills (Interests view only) |
| `components/aligned/ProjectMap.tsx` | Mapbox map with zoom-aware clusters |
| `components/aligned/MapResultsSheet.tsx` | Bottom sheet synced with map viewport |
| `components/aligned/RegionPicker.tsx` | Searchable region dropdown for project creation |
| `hooks/useMapData.ts` | Zoom-aware data fetching (country/state/project RPCs) |
| `hooks/useMapViewport.ts` | Debounced viewport tracking |
| `hooks/useProjectBookmarks.ts` | Bookmark toggle mutation |
| `hooks/useCreateProject.ts` | Project submission with image upload |
| `lib/mapbox.ts` | Mapbox config, tokens, zoom tiers, category colors |

### Key Rule: No Category Chips on Map View
Category filter chips (`FilterChips.tsx`) appear ONLY on the Interests view. The Map view has no filters — just the map and results sheet.

---

## 3. Board View

### Content (top to bottom)
1. **Projects entry card** — dark gradient, tapping goes to Map view
2. **Interests entry card** — dark gradient, tapping goes to Interests view
3. **Notes action row** — cream card with pen icon, opens notes
4. **Spark action row** — cream card with + icon, begins new project
5. **Scan a member** — dark card with scanner brackets, gold scan line, opens QR scanner
6. **Recent connections** — section label + empty state (or connection rows when populated)

### Scan a Member
- Dark gradient card: `linear-gradient(155deg, #1C1C1C 0%, #0F0F0F 50%, #1A1510 100%)`
- Gold corner brackets (top-left, bottom-right) at 20% opacity
- Gold dashed scan line across center
- Grain texture overlay
- Opens camera with QR scanner (see CODEX-PROFILE-REDESIGN.md section 9)

---

## 4. Map View — The Main Feature

### Platform: Mapbox (`@rnmapbox/maps`)
- Already installed in `package.json`
- Plugin configured in `app.json`
- Token config in `lib/mapbox.ts`
- **REQUIRED**: Create Mapbox account, get public token, add to `.env` as `EXPO_PUBLIC_MAPBOX_TOKEN`
- **REQUIRED**: Design custom dark style in Mapbox Studio (see section 6 below)

### Map Layout
```
┌────────────────────────────────┐
│ [AU] [Africa] [UK]    [+] [-] │  ← region chips + zoom controls
│                                │
│     MAPBOX MAP VIEW            │  ← 55% of screen, dark luxury style
│     gold clusters/pins         │
│                                │
│              TAP TO EXPAND  +  │  ← hint + floating add button
│────────────────────────────────│
│ ─── drag handle ───            │  ← results sheet
│ 12 projects in view    EXPAND  │
│                                │
│ [D] Diaspora Capital Fund   🔖│  ← project cards with bookmarks
│ [M] Melbourne Black Founders🔖│
└────────────────────────────────┘
```

### Region Navigation Chips
Top-left of map: **AU** (default, active), **Africa**, **UK**
- Tapping switches the map view to that continent
- AU is always the default on load
- In production: Mapbox camera flies to continent center coordinates:
  - AU: `[133.77, -25.27]` zoom 3
  - Africa: `[20.0, 5.0]` zoom 2.5
  - UK: `[-3.5, 54.5]` zoom 4.5

### Fullscreen Expand
- Tapping the map body (not controls/pins/clusters) expands to fullscreen
- Close button (×) appears top-left
- Map fills entire viewport
- Tap × or swipe down to dismiss

### Zoom-Aware Data Loading (from `useMapData.ts`)
| Zoom | Data Source | RPC | What Shows |
|------|-----------|-----|------------|
| 0-4 | Country aggregates | `map_countries()` | Gold cluster circles with count |
| 5-6 | State aggregates | `map_states(bounds)` | State-level clusters |
| 7-8 | Individual projects | `map_projects(bounds)` | Charcoal pins with category accent |

Max zoom: **8** (privacy — no street-level detail)

### Cluster Styling
- Circle: charcoal `#1C1C1C` fill, 2px gold `#C9A962` stroke
- Count: JetBrains Mono, gold color
- Size scales with count (18px for 1, 24px for 10, 32px for 50, 40px for 100+)
- Active cluster (VIC in prototype): gold pulse animation ring
- Tap: zooms to next tier (country→state→project)

### Pin Styling
- Circle: 14px, charcoal fill
- Stroke: 2.5px, color based on category:
  - Gold `#C9A962`: Venture, Creative, Culture, Tech
  - Burgundy `#722F37`: Advisory, Impact, Health
- Glow shadow: `0 0 8px` in accent color

### Results Sheet
- Uses `@gorhom/bottom-sheet` (already installed)
- Snap points: 12% (peek), 45% (half), 85% (full)
- Header: serif count number + "projects in view" + "EXPAND"
- Project cards: image square + category label + title + description + creator + location + bookmark icon
- Selected project: expanded detail card with "Save to Interested In", "Visit Link", "Contact [Name]"

### Bookmark/Save Flow
- Bookmark icon on every project card in the results sheet
- Bookmark icon on every interest card in the Interests view
- Tapping saves to `project_bookmarks` table
- Saved items appear in Profile → Interested In panel
- Unsaved state: outline bookmark, light background
- Saved state: filled bookmark, black background

### Contact Feature
- "Contact [Name]" button appears on expanded detail cards (both Map and Interests)
- Uses `mailto:` link → opens device email app
- Auto-fills recipient email and subject line: "AMARI — Connecting on [Project Name]"
- **Community guideline** shown below every Contact button:
  > "Community guideline: All communication between members must reflect AMARI values of respect, integrity, and mutual benefit. Behaviour inconsistent with these values may result in removal from the community."

---

## 5. Interests View

### Layout
- Category filter chips at top (All, Venture, Advisory, Creative, Impact, Culture, Health, Tech)
- Expanded detail card for selected/first interest (with contact + save buttons)
- Clean list rows below (inspired by Tide/Clubhouse apps)

### List Row Structure
```
┌──────────────────────────────────────────────┐
│ [Avatar]  VENTURE              [🔖 bookmark] │
│           Kofi M.                             │
│           Looking to connect with founders... │
│           [Venture] [Fintech]                 │
└──────────────────────────────────────────────┘
```

- Avatar: 52px, rounded 14px, black bg, white initials
- Category: mono 9px, gold or burgundy
- Name: sans 15px bold
- Description: sans 12px, truncated single line
- Tags: small pills, light background
- Bookmark: 40px square, rounded 11px, visible border

### Key Rule: No Job Roles
**NEVER** show job titles, roles, or professional designations on any member-facing screen. Only show: name, location, project/interest description, and tags. AMARI is about what people are building, not their corporate titles.

---

## 6. Mapbox Studio Style Specification

### Style Name: AMARI Dark Luxury
Start from Mapbox **"Dark"** template and modify:

| Layer | Property | Value |
|-------|----------|-------|
| Background | color | `#1a1a1a` |
| Water | fill-color | `#141414` with subtle blue tint |
| Land | fill-color | `#1a1a1a` (ocean/land nearly same, land slightly warmer) |
| Country boundaries | line-color | `rgba(114, 47, 55, 0.35)` — burgundy 35% |
| State boundaries | line-color | `rgba(255, 255, 255, 0.06)` |
| Country labels | text-color | `#C9A962` (gold) |
| Country labels | text-font | Plus Jakarta Sans Bold (or DIN Pro Bold) |
| State labels | text-color | `#666666` |
| City labels | text-color | `#555555` |
| City labels | min-zoom | 5 |
| Roads (all types) | visibility | **none** |
| Transit | visibility | **none** |
| POI labels | visibility | **none** |
| Building footprints | visibility | **none** |
| House numbers | visibility | **none** |
| Street names | visibility | **none** |
| Parking | visibility | **none** |
| Land use (parks etc) | fill-color | `#1e1e1e` — barely visible |

**Result:** Dark minimal surface where geography is implied by boundaries and labels. Gold country names on charcoal. No roads, no buildings, no clutter.

---

## 7. Database — Already Created

### New Migration: `20260326000001_map_feature.sql`
- PostGIS extension enabled
- `region_centroids` table — 32 seeded regions (AU states/cities + international diaspora hubs)
- `projects` table — with category enum, approval flow, display_point auto-populated from region centroid
- `project_bookmarks` table
- 3 map cache tables: `map_cache_countries`, `map_cache_states`, `map_cache_projects`
- 3 RPC functions: `map_countries()`, `map_states(bounds)`, `map_projects(bounds)`
- Auto `updated_at` trigger, auto `display_point` from region centroid
- Full RLS policies on all tables

### Refresh RPC: `20260326000002_map_refresh_rpc.sql`
- `refresh_map_cache()` function — clears and repopulates all cache tables
- Privacy degradation: regions with < 3 projects degrade to broader geography
- Can be called by Edge Function or pg_cron

### Edge Function: `supabase/functions/refresh-map-data/index.ts`
- Weekly refresh pipeline (Monday 00:00 AEST)
- Queries approved projects, applies privacy degradation, populates cache tables
- Can be triggered manually from admin panel

### Project Categories (canonical, used everywhere)
| Category | Pin Accent |
|----------|-----------|
| Venture | Gold `#C9A962` |
| Advisory | Burgundy `#722F37` |
| Creative | Gold `#C9A962` |
| Impact | Burgundy `#722F37` |
| Culture | Gold `#C9A962` |
| Health | Burgundy `#722F37` |
| Tech | Gold `#C9A962` |

### Types: `types/database.ts`
Already updated with: `Project`, `ProjectCategory`, `ProjectStatus`, `RegionCentroid`, `ProjectBookmark`, `MapCountryCluster`, `MapStateCluster`, `MapProject`

---

## 8. Project Submission Flow

### Screen: `app/(tabs)/aligned/create.tsx` (already rebuilt)

Fields:
1. Cover image (optional) — image picker, uploads to Supabase Storage
2. Project name — text input, max 60 chars
3. Description — text area, max 100 chars with live counter
4. Category — 7 category pills (gold/burgundy accents)
5. Region — searchable dropdown from `region_centroids` table (`RegionPicker.tsx`)
6. External link (optional) — URL input

Submit → saves to `projects` table with `status: 'pending'`
Member sees "Pending review" badge on their profile.
Project appears on map only after admin approval + weekly refresh.

---

## 9. Privacy Rules (from Map Plan v2)

1. Members select a region from dropdown — never type addresses
2. Cities below 100K population degrade to state centroid
3. Regions with < 3 projects degrade to broader geography
4. Max zoom: 8 (metro level, no streets)
5. Mapbox style has roads/buildings/POIs removed at ALL zoom levels
6. Display points are always centroids, never user-supplied coordinates
7. Only first names shown on map, never full names

---

## 10. Files Created/Modified This Session

### New Files
| File | Purpose |
|------|---------|
| `supabase/migrations/20260326000001_map_feature.sql` | PostGIS + tables + RPCs |
| `supabase/migrations/20260326000002_map_refresh_rpc.sql` | Refresh cache RPC |
| `supabase/functions/refresh-map-data/index.ts` | Weekly refresh Edge Function |
| `lib/mapbox.ts` | Mapbox config, tokens, zoom tiers |
| `hooks/useMapData.ts` | Zoom-aware data fetching |
| `hooks/useMapViewport.ts` | Debounced viewport tracking |
| `hooks/useProjectBookmarks.ts` | Bookmark toggle |
| `hooks/useCreateProject.ts` | Project submission |
| `components/aligned/ViewToggle.tsx` | Board/Map/Interests toggle |
| `components/aligned/FilterChips.tsx` | Category filter pills |
| `components/aligned/ProjectMap.tsx` | Mapbox map component |
| `components/aligned/MapResultsSheet.tsx` | Bottom sheet with project cards |
| `components/aligned/RegionPicker.tsx` | Region search dropdown |

### Modified Files
| File | Change |
|------|--------|
| `app/(tabs)/aligned/index.tsx` | Rebuilt with view toggle + map + sheet |
| `app/(tabs)/aligned/create.tsx` | Rebuilt for projects model (was tiles) |
| `app/_layout.tsx` | Added `initMapbox()` call |
| `app.json` | Added `@rnmapbox/maps` + `expo-web-browser` plugins |
| `.env.example` | Added `EXPO_PUBLIC_MAPBOX_TOKEN` and `EXPO_PUBLIC_MAPBOX_STYLE_URL` |
| `types/database.ts` | Added all map/project types |

### Dependencies Added
- `@rnmapbox/maps` — Mapbox map rendering
- `expo-web-browser` — In-app browser for external links

### Dependencies Already Installed (no action needed)
- `@gorhom/bottom-sheet` — Results sheet
- `react-native-gesture-handler` — Gestures
- `react-native-reanimated` — Animations
- `expo-haptics` — Haptic feedback

---

## 11. What Codex Needs to Do

### Phase 1: Foundation
1. Create Mapbox account → get public token
2. Add `EXPO_PUBLIC_MAPBOX_TOKEN` to `.env`
3. Design dark luxury style in Mapbox Studio (see section 6)
4. Add `EXPO_PUBLIC_MAPBOX_STYLE_URL` to `.env`
5. Run migrations: `supabase db push`
6. Build EAS dev client: `eas build --profile development` (Mapbox requires native code)

### Phase 2: Font Migration
1. Update `lib/theme.ts` serif aliases (see section 1)
2. Remove Playfair Display imports from `app/_layout.tsx` (keep Plus Jakarta Sans + JetBrains Mono)
3. Remove italic from all title styles
4. Test every screen — property names haven't changed, only underlying fonts

### Phase 3: Verify Components
1. Open the app on dev client
2. Navigate to Aligned tab
3. Test Board/Map/Interests toggle
4. Test map rendering with Mapbox style
5. Test filter chips on Interests view
6. Test project creation flow
7. Test bookmark save/unsave
8. Test fullscreen map expand

### Phase 4: Remaining Implementation
1. Search overlay (top-right search icon)
2. Contact button with `expo-mail-composer` or `Linking.openURL('mailto:...')`
3. External link disclaimer before opening in `expo-web-browser`
4. Admin web panel for project approval (separate React app)
5. Schedule weekly refresh with pg_cron
6. Push notifications on project approval/rejection

---

## 12. What NOT to Do

1. **QR code scannability** — The QR code popup (on Pulse "My Card" button AND Profile card tap) MUST have a pure white `#FFFFFF` background with generous padding (quiet zone) around the QR code for scanner readability. The AMARI emblem should sit BELOW the QR code, not inside it — embedding logos inside QR codes reduces scan reliability. Consider: auto-maxing screen brightness when the QR popup opens, preventing screen sleep while it's visible, and using high error correction (Level H) when generating the QR. Use your best judgement on implementation — you know the Expo ecosystem better than this doc.
2. **Do NOT change the tab bar icons** — keep the existing bottom tab icons/symbols exactly as they are (sun for Pulse, calendar for Events, Y-fork for Aligned, pin for Corridor, person for Me). The HTML prototypes use placeholder icons — ignore those.
2. **Do NOT use Playfair Display** — all serif references now map to Plus Jakarta Sans bold
2. **Do NOT show job roles/titles** — never display professional titles on member-facing screens
3. **Do NOT add category chips to Map view** — chips are for Interests only
4. **Do NOT add expo-haptics to plugins** — it has no config plugin
5. **Do NOT show full names on map** — first names only
6. **Do NOT allow zoom past level 8** — privacy constraint
7. **Do NOT skip the weekly refresh** — map reads from cache tables, not live projects
8. **Do NOT use fake data** — real data or honest empty states

---

## 13. Map Plan Reference

The full implementation plan with all technical decisions is at:
`C:\Users\tapiw\Downloads\AMARI_Map_Plan_v2.md`

This covers: Mapbox vs MapLibre decision, privacy rubric, clustering architecture, browsing paradigm, taxonomy, admin panel, data model, implementation phases, and success criteria.
