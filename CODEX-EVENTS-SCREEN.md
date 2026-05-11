# AMARI Events Screen Redesign — Codex Handoff

## Reference Design
Interactive HTML prototype: `amari-events-v9-prototype.html` in project root
Serve: `python -m http.server 9124 --directory C:\Users\tapiw\Downloads` → `http://localhost:9124/amari-events-v9.html`

---

## Overview

Redesign the Events screen from a basic featured card + simple list into **bold, dark, in-your-face event cards** with:
- Each event type has a unique color palette
- Big bold date numbers
- Venue, dress code, and tier access on every card
- Direct "Register" buttons that open Eventbrite (or any external ticketing link)
- Featured event gets a hero card with full details
- Past events section with lighter cream cards
- Category filter chips

---

## 1. Event Types & Color Palettes

AMARI runs these event types. Each gets a unique dark gradient:

| Type | Gradient | Example |
|------|----------|---------|
| **Gala** | Warm charcoal: `#1A1510 → #0A0A0A → #14100C` | AMARI Annual Gala |
| **Networking** | Deep navy: `#14182A → #0E1220 → #181E30` | Founders Connect Melbourne |
| **Dinner** | Wine/burgundy: `#1F1418 → #180E12 → #221418` | AMARI Supper Club |
| **Collaboration** | Forest green: `#141F17 → #0E1810 → #172014` | AMARI x Deloitte |
| **Lifestyle** | Dark charcoal: `#1C1C1C → #111 → #1A1510` | End of Year Yacht Day |

All cards have grain texture at 4% opacity on top of the gradient.

---

## 2. Filter Chips

Horizontal scrollable row below the header:

```
[All] [Galas] [Networking] [Dinners] [Lifestyle] [Collabs]
```

- Active: black fill, white text
- Inactive: cream background, border `rgba(0,0,0,0.08)`, muted text
- Filters both upcoming and past sections
- "All" is default

Update from current: `['All', 'Dinners', 'Talks']` → `['All', 'Galas', 'Networking', 'Dinners', 'Lifestyle', 'Collabs']`

---

## 3. Featured Event Card (Hero)

The first/featured event gets a large hero treatment:

```
┌──────────────────────────────────────────┐
│ [FEATURED] [GALA]                        │  ← badge row (gold + ghost)
│                                          │
│ 15  NOV                                  │  ← big date (sans 56px 700) + month (mono gold)
│     2026                                 │
│                                          │
│ AMARI Annual Gala 2026                   │  ← title (sans 24px 700 white)
│                                          │
│ ◎ Melbourne Convention Centre            │  ← venue (icon + text, 12px, 50% white)
│ ◷ 6:30 PM — Late                        │  ← time
│ ♡ Black Tie                             │  ← dress code
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ↗  Register on Eventbrite           │ │  ← white button, bold, external link icon
│ └──────────────────────────────────────┘ │
│ ──────────────── gold line ──────────────│
└──────────────────────────────────────────┘
```

### Visual details:
- Min height: 320px
- Border radius: 20px
- Gold radial glow top-right, burgundy glow bottom-left
- Grain texture overlay
- Gold baseline (1px gradient line at bottom)
- Featured badge: gold text, gold border, gold tinted background
- Type badge: ghost white text, subtle border
- The entire card is tappable → opens Eventbrite URL

---

## 4. Upcoming Event Cards

Each event in a dark card with the type-specific gradient:

```
┌──────────────────────────────────────────┐
│ 28   NETWORKING                          │
│ NOV  Founders Connect Melbourne Register │  ← big date + type + title + register button
│      ◎ Buro, Flinders Lane              │
│      ♡ Smart Casual                      │
└──────────────────────────────────────────┘
```

### Card structure:
- Border radius: 16px
- Horizontal layout: date block (left) | info (center) | register button (right)
- Date: day in sans 32px 700 white, month in mono 10px gold tracked uppercase
- Type label: mono 8px tracked uppercase, 35% white
- Title: sans 17px 700 white
- Venue: icon + text, 11px, 40% white
- Dress code: icon + text, 11px, 40% white
- Register button: white background, black text, sans 11px 700, rounded 10px

### Tier Access Lock
Events restricted by tier show a gold lock icon + tier name below the venue/dress code:
```
🔒 PLATINUM +
🔒 LAUREATE ONLY
```
- Font: mono 7px, gold color, 60% opacity
- Lock icon: 10px, gold
- The event card is still visible to all tiers (they can see it exists) but the Register button behavior depends on the user's tier:
  - If user tier >= required tier: opens Eventbrite
  - If user tier < required tier: shows a bottom sheet explaining the tier requirement

---

## 5. Past Events Section

Section label: "PAST" (mono 9px tracked uppercase, 35% black)

Light cream cards (not dark):
```
┌──────────────────────────────────────────┐
│ 02   GALA                                │
│ MAY  AMARI Gala 2026                     │
│      Plaza Ballroom, 191 Collins St      │
│      ATTENDED                            │
└──────────────────────────────────────────┘
```

- Background: cream `#FDFCFA`
- Border: 1px solid `rgba(0,0,0,0.04)`
- Border radius: 14px
- Day: sans 22px 700 black
- Month: mono 9px, 35% black
- Title: sans 14px 700 black
- Venue: sans 11px, 40% black
- "ATTENDED" badge: mono 8px, 20% black (only if user attended)
- Press state: warm background shift

---

## 6. Registration Flow

### How it works:
1. User taps "Register" button or the featured card
2. App calls `Linking.openURL(event.eventbrite_url)` — opens Eventbrite in their default browser/app
3. If the event has a different ticketing platform, use that URL instead
4. The `eventbrite_id` and URL come from the `events` table in Supabase

### Event data model (existing, from `types/database.ts`):
```typescript
interface Event {
  id: number;
  type: EventType;  // 'vibes' | 'dinner' | 'talk' | 'gala' — UPDATE THIS
  title: string;
  description: string | null;
  min_tier: MembershipTier;
  capacity: number | null;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  eventbrite_id: string | null;
  cover_image_path: string | null;
  dress_code: string | null;  // ADD THIS COLUMN
  registration_url: string | null;  // ADD THIS COLUMN
  created_at: string;
  updated_at: string;
}
```

### Database changes needed:
```sql
-- Update event type enum
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events ADD CONSTRAINT events_type_check
  CHECK (type IN ('gala', 'networking', 'dinner', 'lifestyle', 'collaboration'));

-- Add new columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
```

### Update `EventType` in `types/database.ts`:
```typescript
export type EventType = 'gala' | 'networking' | 'dinner' | 'lifestyle' | 'collaboration';
```

---

## 7. Tier Gating Behavior

The existing `TierGate` component and tier system already handle access control. For events:

- **All members** can see all upcoming events in the list
- **Tier-restricted events** show the gold lock badge with required tier
- When a user taps "Register" on a tier-locked event they don't have access to:
  - Show a bottom sheet: "This event requires [Tier] membership"
  - Include a brief description of what that tier offers
  - "Dismiss" button
- When a user taps "Register" on an event they DO have access to:
  - `Linking.openURL(event.registration_url || eventbrite_url)`
  - Haptic feedback: medium impact

---

## 8. Component Mapping

| Prototype Element | React Native Component |
|-------------------|----------------------|
| Featured hero card | New `FeaturedEventCard.tsx` |
| Upcoming event cards | New `EventCard.tsx` (replaces `EventRow` from v2) |
| Past event cards | New `PastEventCard.tsx` |
| Filter chips | Existing `FilterPills` — update options array |
| Register button | `Linking.openURL()` + tier check |
| Tier lock badge | Inline in `EventCard` |

### New files to create:
```
components/events/
  FeaturedEventCard.tsx
  EventCard.tsx
  PastEventCard.tsx
```

---

## 9. Font Rules (consistent with Aligned screen)

All text uses Plus Jakarta Sans (bold for titles) and JetBrains Mono (for labels/badges). No Playfair Display.

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Page title "Events" | sans | 26px | 700 | black |
| Count "4 upcoming" | mono | 11px | 400 | gold |
| Featured date number | sans | 56px | 700 | white |
| Featured month | mono | 13px | 500 | gold |
| Featured title | sans | 24px | 700 | white |
| Featured details | sans | 12px | 400 | 50% white |
| Register button | sans | 14px | 700 | black on white |
| Card date number | sans | 32px | 700 | white |
| Card month | mono | 10px | 500 | gold |
| Card type label | mono | 8px | 500 | 35% white |
| Card title | sans | 17px | 700 | white |
| Card venue/dress | sans | 11px | 400 | 40% white |
| Tier lock | mono | 7px | 500 | gold 60% |
| Section label | mono | 9px | 500 | 35% black |
| Past card title | sans | 14px | 700 | black |
| Past card venue | sans | 11px | 400 | 40% black |

---

## 10. What NOT to Do

1. **Do NOT change the tab bar icons** — keep the existing bottom tab icons/symbols exactly as they are in the current app (sun for Pulse, calendar for Events, Y-fork for Aligned, pin for Corridor, person for Me). The HTML prototypes use placeholder icons — ignore those and use the existing ones from the codebase.
2. **Do NOT use serif fonts** — all titles are Plus Jakarta Sans bold
2. **Do NOT use the old `WhiteCard` wrapper** for featured events — use the new dark gradient card
3. **Do NOT hardcode Eventbrite URLs** — use the `registration_url` field from the database
4. **Do NOT hide tier-locked events** — show them to everyone with a lock badge
5. **Do NOT use the old `EventRow` component** — replace with new `EventCard`
6. **Do NOT use the old event types** `('vibes' | 'dinner' | 'talk' | 'gala')` — update to `('gala' | 'networking' | 'dinner' | 'lifestyle' | 'collaboration')`

---

## 11. Summary of Changes from Current Screen

| Current | New |
|---------|-----|
| Serif title "Events" | Bold sans title |
| Filter: All, Dinners, Talks | Filter: All, Galas, Networking, Dinners, Lifestyle, Collabs |
| WhiteCard with black inner for featured | Full dark gradient hero card (320px) with gold accents |
| "View Details" button | "Register on Eventbrite" with external link icon |
| Simple EventRow list | Bold dark cards per event type with unique color palettes |
| No dress code shown | Dress code on every card with heart icon |
| No tier lock visible | Gold lock badge with tier name |
| No past events | Past events section with cream cards |
| No registration link | Direct Eventbrite/external link on every card |
