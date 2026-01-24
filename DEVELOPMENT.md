# AMARI Mobile - Development Notes

## Build Session: January 24, 2026

### What Was Built

#### 1. Project Setup
- Created Expo project with TypeScript template
- Configured Expo Router for file-based navigation
- Installed dependencies:
  - expo-router, expo-constants, expo-linking
  - expo-secure-store, expo-crypto, expo-image
  - react-native-safe-area-context, react-native-screens
  - zustand, @tanstack/react-query
  - react-native-qrcode-svg, react-native-svg
  - react-native-reanimated

#### 2. Design System (`lib/constants.ts`)
- AMARI color palette (cream, charcoal, burgundy, olive)
- Tier hierarchy with proper ordering
- `canAccessTier()` function for access control
- Tier display names and colors
- Animation constants (baseline-ui compliant)
- Z-index constants

#### 3. Navigation Structure
- Root layout with React Query provider
- 5-tab bottom navigation:
  - Home (index.tsx)
  - Discover (discover.tsx)
  - Events (events.tsx)
  - Network (network.tsx)
  - Profile (profile.tsx)

#### 4. Home Screen Features
- AMARI wordmark header
- Gala countdown card (dark background)
- Upcoming event card
- Connections count
- Announcements list

#### 5. Discover Screen Features
- "Curated by AMARI" subtitle
- Laureate Spotlight (dark card with avatar, name, year, quote)
- AMARI News section
- Partner Spotlight
- Community Achievements
- Partners directory (Platinum/Gold/Silver badges)

#### 6. Events Screen Features
- Your Tickets section with QR placeholder
- Upcoming Events (tier badges shown)
- Invite Only section (only shows if user has invites)
- Past Events section
- Tier-based filtering logic ready

#### 7. Network Screen Features
- Search input
- AI matching option buttons
- Connections list with avatars
- Pending requests with Accept/Decline buttons
- Instagram feed placeholder

#### 8. Profile Screen Features
- Centered avatar with initial
- Name and member ID
- Tier badge component:
  - Council: Circular seal design
  - Other tiers: Colored badge
  - No tier: Simple "Member" text
- "What I'm Building" section with visibility toggle
- "Interested In" tags with visibility
- "Open To" tags with visibility
- Membership Card button

#### 9. Barcode System (`lib/barcode.ts`)
- `MemberBarcode` interface
- `generateMemberBarcode()` - Creates signed QR data
- `verifyMemberBarcode()` - Validates offline
- `shouldHaveQRCode()` - Council check
- HMAC signature using expo-crypto

#### 10. Membership Card Component
- Dark card design (sharp corners)
- AMARI wordmark
- Member name and ID
- QR code (using react-native-qrcode-svg)
- Council Seal (for council members only)
- Tier badge

### Design Decisions

1. **Sharp corners** - No border-radius for luxury feel
2. **Cream background** - Matches prototype (#f8f6f3)
3. **Dark sections** - Charcoal (#1a1a1a) for emphasis
4. **Burgundy accents** - For important items (#722F37)
5. **Uppercase labels** - Section titles with letter-spacing
6. **Tabular numbers** - For countdown and stats

### Key Implementation Notes

#### Tier System
```typescript
// NULL = no tier (new member)
// Hierarchy: council > laureate > platinum > gold > silver > null
const TIER_HIERARCHY = ['council', 'laureate', 'platinum', 'gold', 'silver', null];
```

#### Access Control
```typescript
// Check if user can see tier-gated content
canAccessTier('platinum', 'gold') // true - platinum > gold
canAccessTier('silver', 'platinum') // false - silver < platinum
canAccessTier(null, 'silver') // false - no tier can't access silver
```

#### Council Seal
Council members get a seal design instead of QR code:
- Double circle border
- "COUNCIL" text
- Divider line
- "EST. 2024" year

### Testing Verification

All 5 tabs verified working via browser testing:
- ✅ Home - Countdown displays, sections render
- ✅ Discover - All content sections show
- ✅ Events - Tickets, upcoming, invite-only, past events
- ✅ Network - Search, AI options, connections, requests
- ✅ Profile - Avatar, tier badge, all sections with visibility

### Known Issues / TODO

1. **Fonts not loaded** - Using system fonts, need to add EB Garamond, Syne, DM Sans
2. **Icons are emoji** - Need proper icon library (Lucide or similar)
3. **Mock data only** - No backend connection yet
4. **QR code static** - Not generating real signed barcodes
5. **No auth flow** - Need login/register screens
6. **No deep linking** - Membership card not navigable yet

### Next Steps

1. Add custom fonts (EB Garamond, Syne, DM Sans)
2. Replace emoji icons with Lucide icons
3. Create auth screens with invite code validation
4. Set up Hono.js backend
5. Create PostgreSQL schema on Railway
6. Implement real data fetching with React Query
7. Add pgvector for AI member matching

### Files Changed

```
app.json                    - Updated name, scheme, plugins
package.json                - Added dependencies, expo-router entry
app/_layout.tsx             - Root layout with QueryClient
app/(tabs)/_layout.tsx      - 5-tab configuration
app/(tabs)/index.tsx        - Home screen
app/(tabs)/discover.tsx     - Discover screen
app/(tabs)/events.tsx       - Events screen
app/(tabs)/network.tsx      - Network screen
app/(tabs)/profile.tsx      - Profile screen
lib/constants.ts            - Design system
lib/barcode.ts              - QR generation
components/cards/MembershipCard.tsx - Card component
```

### Reference Files

- Plan: `C:\Users\tapiw\.claude\plans\stateful-watching-nebula.md`
- Prototype: `C:\Users\tapiw\OneDrive\AMARI Group App\AmariAppFinal.jsx`
- Design System: `C:\Users\tapiw\OneDrive\AMARI Group App\INSTRUCTIONS.md`
- Build Instructions: `C:\Users\tapiw\CLAUDE_skills_agents_tools_resources\BUILD_TERMINAL_INSTRUCTIONS.md`
