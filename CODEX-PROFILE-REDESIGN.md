# AMARI Profile Screen Redesign — Codex Handoff

## Reference Design
The final HTML render is at: `../../../Downloads/amari-profile-final-render.html`
Open in a browser to see the exact design, interactions, and animations.

---

## Overview

Complete redesign of the profile tab (`app/(tabs)/profile.tsx`) from a flat list layout to a **pinboard canvas** design with swipeable sub-tabs, a membership card with QR code popup, project tiles, and wallet integration. Also includes a new QR scanner feature for the **Aligned** tab.

---

## 1. Font Migration

### Current Fonts (REMOVE)
```
EB Garamond (serif) → REPLACED
Syne (geometric) → REPLACED
DM Sans (body) → REPLACED
IBM Plex Mono (mono) → REPLACED
```

### New Fonts (INSTALL & LOAD)
```bash
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/jetbrains-mono
```

| Role | Old | New | Usage |
|------|-----|-----|-------|
| Serif (headlines, names) | EB Garamond | **Playfair Display** | Card name, project titles, interested-in titles |
| Sans (body, UI) | DM Sans | **Plus Jakarta Sans** | Body text, buttons, tab labels, descriptions |
| Geo (labels, badges) | Syne | **Plus Jakarta Sans** (weight 600-700) | Section labels, badges, nav — no longer a separate font |
| Mono (metadata, codes) | IBM Plex Mono | **JetBrains Mono** | Member ID, tier badge, status labels, counters |

### Files to Update
- **`app/_layout.tsx`**: Replace `useFonts` imports. Load:
  - PlayfairDisplay_400Regular, _500Medium, _600SemiBold, _700Bold, _800ExtraBold, _400Regular_Italic, _500Medium_Italic
  - PlusJakartaSans_300Light, _400Regular, _500Medium, _600SemiBold, _700Bold, _300Light_Italic, _400Regular_Italic
  - JetBrainsMono_300Light, _400Regular, _500Medium

- **`lib/theme.ts`**: Update `typography` object:
  ```typescript
  export const typography = {
    serif: {
      regular: 'PlayfairDisplay_400Regular',
      italic: 'PlayfairDisplay_400Regular_Italic',
      medium: 'PlayfairDisplay_500Medium',
      semiBold: 'PlayfairDisplay_600SemiBold',
      bold: 'PlayfairDisplay_700Bold',
      extraBold: 'PlayfairDisplay_800ExtraBold',
    },
    // Plus Jakarta Sans replaces BOTH body (DM Sans) and geo (Syne)
    body: {
      light: 'PlusJakartaSans_300Light',
      regular: 'PlusJakartaSans_400Regular',
      medium: 'PlusJakartaSans_500Medium',
      semiBold: 'PlusJakartaSans_600SemiBold',
      bold: 'PlusJakartaSans_700Bold',
    },
    geo: {
      // Alias to body — Syne is replaced by Jakarta Sans at heavier weights
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

- **Every file that imports `typography`** — the property names stay the same (`serif`, `body`, `geo`, `mono`) so existing code should work. But grep for any hardcoded font family strings like `'EBGaramond-Regular'` and replace them.

### Responsive Sizing
Use `expo-dev-client` to test on both iOS and Android simulators. Key sizing rules:
- All text uses the **8px grid** from `lib/theme.ts` spacing scale
- Card aspect ratio: **1.6:1** (fixed, not fluid)
- Max content width: **430px** (iPhone 16 Pro Max width, Android scales down)
- Use `useSafeAreaInsets()` for top padding (status bar) and bottom padding (home indicator)
- Tab bar height: fixed 56px + bottom inset
- Test on: iPhone 15 (390px), iPhone 16 Pro Max (430px), Pixel 8 (412px), Galaxy S24 (360px)

---

## 2. Profile Screen Architecture

### Layout Structure
```
<SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }}>
  <ScrollView>
    {/* 1. Membership Card (fixed, always visible at top) */}
    <MembershipCard onPress={openCardPopup} />

    {/* 2. Sub-tab switcher */}
    <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

    {/* 3. Swipeable panels (PanGestureHandler + Animated) */}
    <SwipeableContainer activeTab={activeTab} onSwipe={setActiveTab}>
      <MyProjectsPanel />
      <InterestedInPanel />
      <AccountPanel />
    </SwipeableContainer>

    {/* 4. AMARI Emblem footer (per panel) */}
    <EmblemFooter />
  </ScrollView>

  {/* 5. Card popup overlay (modal, portaled) */}
  <CardPopupModal visible={showCardPopup} onClose={closeCardPopup} />
</SafeAreaView>
```

### Sub-tab Swipe Navigation
- Use `react-native-pager-view` OR `react-native-gesture-handler` PanGestureHandler with Reanimated
- Three panels: **My Projects** (index 0), **Interested In** (index 1), **Account** (index 2)
- Gold underline indicator animates between tabs (Reanimated `useAnimatedStyle` with `withSpring`)
- Swipe dots below tabs: 3 dots, active dot is elongated gold pill (16px wide), inactive dots are 5px circles
- Touch-drag threshold: 50px to trigger page change
- Tab buttons also tappable (instant snap with spring animation)

---

## 3. Membership Card Design

### Visual Layers (bottom to top)
The card is a dark gradient container with multiple layered effects:

1. **Base**: `linear-gradient(155deg, #1C1C1C 0%, #0F0F0F 50%, #1A1510 100%)` — warm charcoal
2. **Grain texture**: SVG noise filter at 4% opacity — prevents flat digital look
3. **Ambient wash**: Conic gradient (`gold → purple → teal → gold`) rotating slowly (10s linear infinite), `mix-blend-mode: overlay`, 25% opacity, `blur(25px)` — this creates the living, color-shifting background
4. **Prismatic drift**: Three overlapping radial gradients (gold center-left, purple top-right, teal bottom-center) that translate/rotate on a 5s cycle — creates moving pools of color
5. **Shimmer sweep**: Wide linear gradient band (`transparent → gold → white → purple → gold → transparent`) sweeping left-to-right on a 5s cycle — the visible "glint" across the card
6. **Gold baseline**: 1px horizontal line with gradient fade at edges, sits at very bottom
7. **AMARI emblem watermark**: The actual emblem PNG (`assets/images/amari-emblem.png`) positioned bottom-right, 52x52px, ~4.5% opacity with `brightness(10)` filter to make it appear as a subtle white ghost
8. **Content layer**: All text and avatar on top

### Card Content Layout
```
┌─────────────────────────────────────────┐
│ A M A R I                    [LAUREATE] │  ← brand (Jakarta 13px 700 ls:5) + tier badge (Mono 9px)
│                                         │
│ (JN) Jeremy Nyerenyere                  │  ← avatar (48px circle, gold gradient) + name (Playfair 21px 500)
│      Melbourne, AU                      │  ← location (Jakarta 11px, 40% white)
│                                         │
│ AMARI-2026-BF85F4B9    Tap for pass  [A]│  ← ID (Mono 9px 25% white) + hint (pulsing) + emblem watermark
└─────────────────────────────────────────┘
```

### Card Colors Are Dynamic
The ambient wash and prismatic layers create a subtly shifting color palette. In the React Native implementation:
- Use `expo-linear-gradient` for the base gradient
- Use `Reanimated` animated values for the prismatic drift (translateX, rotate) and shimmer sweep (translateX)
- Use a `MotiView` with `animate={{ rotate: '360deg' }}` transition `repeat: Infinity` for the ambient conic wash
- The card should feel **alive** — not static. Colors subtly shift as you look at it.

### Card Border Radius & Shadow
- Border radius: 16px
- Shadow (iOS): `{ shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 32 }`
- Elevation (Android): 12
- Additional inner shadow via gradient overlay at edges

---

## 4. Card Popup (Tap to Scan)

When the card is tapped, a fullscreen modal appears:

### Animation
- Background: fades from transparent to `rgba(5, 5, 5, 0.97)` over 400ms
- Card: scales from 0.8 to 1.0 with spring physics (`damping: 15, stiffness: 150`), fades in
- QR section: scales from 0.9 to 1.0, fades in with 200ms delay
- Wallet buttons: translate up from 10px, fade in with 300ms delay
- Dismiss text: fade in with 400ms delay

### Popup Layout
```
┌──────────────────────────────────────────┐
│                                          │
│          ┌──────────────────┐            │
│          │     AMARI  [LAU] │            │  ← Same card design as main
│          │ (JN) Jeremy N.   │            │     but larger, with emblem
│          │ AMARI-2026-BF85  │            │     watermark visible
│          └──────────────────┘            │
│                                          │
│             ┌──────────┐                 │
│             │  QR CODE │                 │  ← White rounded container (12px radius)
│             │  with A  │                 │     140x140 QR canvas
│             │  center  │                 │     Emblem in center of QR
│             └──────────┘                 │
│          AMARI-2026-BF85F4B9             │  ← Mono 10px, 30% white
│                                          │
│      [ Apple Wallet] [Google Wallet]     │  ← Frosted glass buttons
│                                          │
│          Tap anywhere to close           │  ← 20% white, Jakarta 11px
│                                          │
└──────────────────────────────────────────┘
```

### QR Code
- Use `react-native-qrcode-svg` package for real QR generation
- QR data: `https://amari.app/member/{user_uuid}` — this is the scannable URL
- QR foreground: `#0A0A0A`, background: `#FFFFFF`
- Center logo: AMARI emblem PNG (actual image, not "A" letter)
- QR container: white background, 12px radius, subtle shadow, 12px padding
- The QR code is **unique per member** — generated from their Supabase UUID

### Wallet Integration
Two buttons side by side:
- **Apple Wallet**: Uses `react-native-wallet-manager` or deep link to `wallet://` — generates a `.pkpass` file
- **Google Wallet**: Uses Google Wallet API — generates a JWT pass
- Both buttons: frosted glass style (`rgba(255,255,255,0.06)` bg, 1px border at 12% white, 10px radius, `backdrop-filter: blur(10px)`)
- On press: scale down to 0.97, border shifts to gold
- For MVP: buttons can show a "Coming soon" alert. The UI should be there.

### Dismiss
- Tap anywhere outside the card/QR/wallet area to close
- Animate out: reverse of open (scale down, fade out, background fades)

---

## 5. My Projects Panel (Pinboard Canvas)

### Concept
Projects are displayed as **canvas tiles** pinned to a board — like sticky notes on a corkboard. Each tile is slightly rotated, has a tape/pin accent at the top, linen weave texture, and a paint-stroke accent.

### Grid Layout
```
┌─────────────────────────────────────┐
│                        2 of 3 slots │  ← Mono 9px, 15% black, right-aligned
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [pin]                           │ │  ← Hero tile: full-width, rotated -0.5deg
│ │ VENTURE                      01│ │     Category (Mono 8px gold) + rank (Playfair 52px 2.5% white)
│ │                                 │ │
│ │ Diaspora Capital Fund           │ │     Title (Playfair 24px 600 white)
│ │ Early-stage fund investing...   │ │     Desc (Jakarta 11px 28% white)
│ │ ● ACTIVE                       │ │     Status dot (4px, pulsing) + label (Mono 7px)
│ └─────────────────────────────────┘ │
│ ┌───────────────┐ ┌───────────────┐ │
│ │ [pin]         │ │ ┌─  ─  ─  ─┐ │ │  ← Two-column grid below hero
│ │ COMMUNITY  02 │ │ │           │ │ │     Left: secondary tile, rotated +0.8deg
│ │               │ │ │    (+)    │ │ │     Right: dashed "Add project" slot
│ │ Melbourne     │ │ │  Add      │ │ │
│ │ Black Founders│ │ │  project  │ │ │
│ │ ● BUILDING    │ │ └─  ─  ─  ─┘ │ │
│ └───────────────┘ └───────────────┘ │
└─────────────────────────────────────┘
```

### Tile Color Palettes (EACH TILE IS DIFFERENT)
Do NOT make all tiles the same color. Assign palettes based on project category or index:

| Palette | Base Gradient | Accent Stroke | Category Color | Status Dot |
|---------|--------------|---------------|----------------|------------|
| **Warm Charcoal** (default/venture) | `#1A1917 → #141210 → #1C1812` | Gold `rgba(196,162,101,0.55)` | Gold | Gold |
| **Deep Navy** (community) | `#141822 → #0E1218 → #171D26` | Steel blue `rgba(140,170,210,0.45)` | `rgba(140,170,210,0.7)` | Steel blue |
| **Forest** (research/impact) | `#141F17 → #0E1810 → #172014` | Sage `rgba(120,180,130,0.4)` | `rgba(120,180,130,0.7)` | Sage |
| **Wine** (arts/culture) | `#1F1418 → #180E12 → #201417` | Rose `rgba(196,130,140,0.4)` | `rgba(196,130,140,0.7)` | Rose |
| **Smoke** (tech/engineering) | `#181818 → #121212 → #1A1A1A` | Silver `rgba(180,180,190,0.4)` | `rgba(180,180,190,0.7)` | Silver |

### Tile Textures & Details
Each canvas tile has these layers:
1. **Surface**: The colored gradient background, `border-radius: 3px`
2. **Linen weave**: Repeating linear gradient (horizontal + vertical hairlines at 4px intervals, 5.5% opacity) — gives paper/fabric feel
3. **Paint stroke**: 3px high gradient at the top edge, using the palette accent color — like a brushstroke of paint
4. **Pin/tape accent**: Small rectangle (20x8px) at the top, slightly rotated, accent-colored at 25% opacity with subtle shadow — like tape holding the note
5. **Corner curl**: Bottom-right, 16px triangle gradient — like paper lifting
6. **Ghost rank number**: Large Playfair Display number (36px for secondary, 52px for hero) at top-right, 2.5% opacity — barely visible watermark

### Tile Interactions
- **Press**: Scale down to 0.97 with spring physics (Reanimated `withSpring`)
- **Haptic**: Light impact on press (`Haptics.impactAsync(ImpactFeedbackStyle.Light)`)
- **Tap**: Navigate to project detail screen (future)
- **Long press**: Show edit/reorder options (future)

### "Add Project" Slot
- Dashed border: 1.5px, `rgba(0,0,0,0.1)`
- Centered: circle with "+" (32px, serif font) + "Add project" label (Jakarta 10px)
- Hover/press: border and icon shift to gold
- Rotated +0.4deg (like other tiles)

### Project Data Model
Projects come from a `projects` table in Supabase:
```sql
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  title text not null,
  description text,
  category text check (category in ('venture', 'community', 'research', 'arts', 'tech', 'other')),
  status text default 'active' check (status in ('active', 'building', 'paused', 'completed')),
  is_public boolean default true,
  slot_index integer check (slot_index between 1 and 3),  -- max 3 projects
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Project Update Prompts
Members are prompted **twice a month** (1st and 15th, or nearest weekday) to update their projects:
- Push notification: "How's [Project Name] going? Tap to update your status."
- In-app: A subtle banner appears at the top of My Projects panel: "It's been 2 weeks — update your projects?" with a gold outline dismiss "X" and a "Update" button
- The prompt disappears after interacting with any project tile OR dismissing
- Track last_prompted_at in the projects table or a separate user_prompts table
- If a user has no projects, prompt to create one instead

### How Projects Feel
- When the profile loads, tiles **stagger in** with a slight delay (40ms between each) using `MotiView` from bottom (translateY: 20 → 0, opacity: 0 → 1)
- The rotations give a **hand-placed** feel — not a rigid grid
- The linen texture and paint strokes make them feel **physical**, like actual canvases on a wall
- The ghost rank numbers give depth without being obtrusive
- The pulsing status dot shows the project is **alive**
- Max 3 project slots — scarcity creates intentionality. The counter ("2 of 3 slots") reinforces this

---

## 6. Interested In Panel

### Design
Vertical list of bookmark cards — projects by OTHER members that this user has bookmarked/expressed interest in.

### Card Structure
```
┌─────────────────────────────────────┐
│ [bookmark icon]  EVENTS             │  ← Bookmark SVG (18x22px, gold 35%) + Category (Mono 7px, gold-dark 40%)
│                  Pan-African Tech   │  ← Title (Playfair 14px 500 black)
│                  Summit 2026        │
│                  Amara K.           │  ← Author (Jakarta 10px, 25% black)
│                  NOTIFICATIONS ON   │  ← Status (Mono 7px, gold-dark 35%)
└─────────────────────────────────────┘
```

- Background: `colors.bone` → cream `#FDFCFA`
- Border: 1px solid `rgba(0,0,0,0.04)`
- Border radius: 10px
- Shadow: `0 1px 3px rgba(0,0,0,0.03)`
- Press state: background shifts to warm `#EDE7DE`, border shifts to gold 12%

### Data Source
Query from an `interested_in` junction table:
```sql
create table interested_in (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  project_id uuid references projects(id),
  notify boolean default true,
  created_at timestamptz default now()
);
```

---

## 7. Account Panel

### Details Section
Label: "DETAILS" (Mono 8px, 15% black, 2.5px letter-spacing)

White card (`#FDFCFA`) with rows:
| Field | Type | Example |
|-------|------|---------|
| City | Editable | Melbourne |
| Company | Editable, empty state: "Add company" (italic 12px, 18% black) | — |
| Sector | Editable | Finance |
| Open to | Editable, empty state: "Add interests" | — |
| Current project | Read-only (pulled from active project) | Diaspora Capital Fund |

Each row: label (Mono 9px uppercase) + value (Jakarta 14px) + chevron right (14px, 10% black).
Rows separated by 1px `rgba(0,0,0,0.04)` divider.
Press: warm background shift.
Tap: opens `EditFieldModal` bottom sheet.

### Settings Section
Label: "SETTINGS"

Same white card style, rows:
- Edit profile (Jakarta 14px, 45% black)
- Notifications
- Privacy
- Help
- **Sign out** (muted red: `rgba(180,68,68,0.55)`, chevron also reddish)

---

## 8. AMARI Emblem Footer

At the bottom of each panel (My Projects, Interested In, Account):
- The actual AMARI emblem PNG: 42x42px, 12% opacity, 6px border radius
- "AMARI" wordmark below: Jakarta 9px, 600 weight, 4px letter-spacing, 6% black opacity
- Centered, 40px top padding, 24px bottom padding

The emblem image is at: `assets/images/amari-emblem.png` (600x599px source)

---

## 9. Aligned Tab — QR Scanner Feature (NEW)

### Concept
In the **Aligned** tab (`app/(tabs)/aligned.tsx`), add a **scan button** that opens the camera to scan another member's QR code. When scanned, it shows that person's profile card and their projects, allowing you to add their projects to your "Interested In" list.

### Flow
1. User taps scan icon (top-right of Aligned screen, or floating action button)
2. Camera opens with QR scanner overlay (use `expo-camera` with `BarCodeScanner`)
3. Scanner frame: rounded square cutout in dark overlay, gold corner brackets, "Scan a member's code" label
4. On successful scan of `https://amari.app/member/{uuid}`:
   - Haptic success feedback
   - Camera closes
   - **Member card sheet** slides up from bottom (like the card popup but as a bottom sheet)
5. Member card sheet shows:
   - Their membership card (same design, read-only)
   - Their public projects as canvas tiles (read-only, not editable)
   - "Interested" button on each project tile — tap to add to your Interested In list
   - "Close" handle at top

### Scanner UI
```
┌─────────────────────────────────────┐
│                                     │  ← Dark overlay (60% black)
│        ┌─ ─ ─ ─ ─ ─ ─ ─ ─┐        │
│        │                   │        │  ← Transparent cutout (250x250px)
│     ┌──┘                   └──┐     │     Gold corner brackets (3px thick, 30px long)
│     │                         │     │
│     └──┐                   ┌──┘     │
│        │                   │        │
│        └─ ─ ─ ─ ─ ─ ─ ─ ─┘        │
│                                     │
│      Scan a member's QR code        │  ← Jakarta 14px, white
│                                     │
│           [ Use code instead ]      │  ← For manual entry fallback
└─────────────────────────────────────┘
```

### Add to Interested In
When viewing someone's projects after scanning:
- Each project tile shows a small bookmark icon in the corner
- Tap bookmark → haptic + icon fills gold → project added to your "Interested In"
- Toast notification: "Added to your interests"
- The member's projects appear on your Interested In panel next time you visit profile

---

## 10. New Packages to Install

```bash
# Fonts
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/jetbrains-mono

# QR Code
npx expo install react-native-qrcode-svg react-native-svg

# QR Scanner (for Aligned tab)
npx expo install expo-camera expo-barcode-scanner

# Wallet (can be deferred to v2)
# npx expo install react-native-wallet-manager

# Pager (for swipeable tabs)
npx expo install react-native-pager-view
```

---

## 11. New Components to Create

| Component | Path | Purpose |
|-----------|------|---------|
| `MembershipCard` | `components/v2/MembershipCard.tsx` | The dark prismatic card with all layered effects |
| `CardPopupModal` | `components/v2/CardPopupModal.tsx` | Fullscreen modal with card + QR + wallet buttons |
| `ProfileTabSwitcher` | `components/v2/ProfileTabSwitcher.tsx` | My Projects / Interested In / Account tabs with gold indicator |
| `CanvasTile` | `components/v2/CanvasTile.tsx` | Pinboard project tile with textures, rotations, palettes |
| `ProjectPinboard` | `components/v2/ProjectPinboard.tsx` | The grid container for canvas tiles |
| `InterestedCard` | `components/v2/InterestedCard.tsx` | Bookmark card for interested-in projects |
| `EmblemFooter` | `components/v2/EmblemFooter.tsx` | AMARI emblem + wordmark footer |
| `QRScanner` | `components/v2/QRScanner.tsx` | Camera scanner with gold bracket overlay |
| `MemberProfileSheet` | `components/v2/MemberProfileSheet.tsx` | Bottom sheet showing scanned member's card + projects |

---

## 12. Color Updates to lib/theme.ts

Add these new colors to the existing `colors` object:

```typescript
// Card colors
cardBase: '#1C1C1C',
cardDark: '#0F0F0F',
cardWarm: '#1A1510',
gold: '#C4A265',
goldLight: '#D4B87A',
goldDark: '#A8884F',

// Tile palettes
tileNavy: '#141822',
tileNavyDark: '#0E1218',
tileNavyAccent: 'rgba(140,170,210,0.45)',
tileForest: '#141F17',
tileForestDark: '#0E1810',
tileForestAccent: 'rgba(120,180,130,0.4)',
tileWine: '#1F1418',
tileWineDark: '#180E12',
tileWineAccent: 'rgba(196,130,140,0.4)',
tileSmoke: '#181818',
tileSmokeDark: '#121212',
tileSmokeAccent: 'rgba(180,180,190,0.4)',

// Popup
overlayHeavy: 'rgba(5,5,5,0.97)',
```

---

## 13. Files That Need Changes

### Must Change
- `lib/theme.ts` — Font families, new colors
- `app/_layout.tsx` — Font loading (replace all 4 font families)
- `app/(tabs)/profile.tsx` — Complete rewrite to new design
- `app/(tabs)/aligned.tsx` — Add QR scanner button + flow
- `components/v2/index.ts` — Export new components
- `components/v2/CustomTabBar.tsx` — Update font references

### Should Check (font references)
- `components/v2/Badge.tsx`
- `components/v2/SectionLabel.tsx`
- `components/v2/InfoRow.tsx`
- `components/v2/Barcode.tsx`
- `components/v2/WhiteCard.tsx`
- `components/EditFieldModal.tsx`
- `components/EventDetailSheet.tsx`
- All files in `app/(tabs)/` that use typography
- All files in `components/v2/` that reference font families

### Can Remove (replaced by new components)
- `components/v2/Barcode.tsx` — Replaced by QR code in CardPopupModal

---

## 14. Testing Checklist

- [ ] Fonts load correctly on iOS and Android (no fallback to system fonts)
- [ ] Card shimmer/prismatic animations run at 60fps
- [ ] Card popup opens/closes smoothly
- [ ] QR code generates unique pattern per user
- [ ] Swipe between sub-tabs is smooth with momentum
- [ ] Tab indicator animates with spring physics
- [ ] Canvas tiles render with correct palette per category
- [ ] Tile stagger animation on load
- [ ] Press states have haptic feedback
- [ ] Empty states show correctly (no projects, no interested items)
- [ ] Account panel edit modals work
- [ ] Sign out works
- [ ] AMARI emblem renders at correct opacity
- [ ] Safe area insets respected (no content under status bar or home indicator)
- [ ] Keyboard doesn't cover edit modals
- [ ] Android back button closes card popup
- [ ] Accessibility: all interactive elements have labels
- [ ] WCAG AA contrast ratios maintained

---

## 15. What NOT to Do

- Do NOT use fake data — real data from Supabase or honest empty states
- Do NOT hardcode font family strings — always use `typography.serif.regular` etc
- Do NOT add `expo-haptics` to `app.config.js` plugins array — it has NO config plugin
- Do NOT build from the OneDrive directory — clone from GitHub and build from `C:\Users\tapiw\amari-build\`
- Do NOT push directly to main — create a feature branch and PR
- Do NOT add emoji anywhere
- Do NOT use Inter, Poppins, or Montserrat — those are AI-generic fonts
