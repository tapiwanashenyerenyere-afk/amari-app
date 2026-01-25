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

1. **Mock data only** - No backend connection yet
2. **QR code static** - Not generating real signed barcodes
3. **No deep linking** - Membership card not navigable yet
4. **No auth state management** - Need to implement proper auth flow with storage

### Next Steps

1. Set up Hono.js backend
2. Create PostgreSQL schema on Railway
3. Implement real data fetching with React Query
4. Add pgvector for AI member matching
5. Implement auth state persistence with expo-secure-store

---

## Build Session: January 25, 2026

### What Was Built

#### 1. Custom Fonts
- Installed expo-font and Google Fonts packages
- EB Garamond (serif) - Body text, quotes
- Syne (display) - Headings, AMARI wordmark
- DM Sans (sans) - UI elements, labels
- Font loading with splash screen handling

#### 2. Lucide Icons
- Replaced all emoji icons with Lucide React Native
- Tab bar: Home, Compass, Calendar, Users, User
- Network: Search, Instagram
- Profile: Eye, EyeOff, CreditCard, ChevronRight

#### 3. Auth Screens
- Welcome screen with "Excellence. Community. Legacy." tagline
- Invite code entry with validation (mock API)
- Registration form (name, email, "what I'm building")
- Minimal, secretive messaging ("Membership is by invitation only")

### Design Decisions

1. **Secretive messaging** - No details about what AMARI is, just "invite only"
2. **Dark auth screens** - Charcoal background for premium feel
3. **Syne for wordmark** - Bold display font with wide letter-spacing
4. **EB Garamond for tagline** - Elegant serif for the values

### Files Changed

```
app/_layout.tsx            - Added font loading with SplashScreen
app/(tabs)/_layout.tsx     - Lucide icons for tab bar
app/(tabs)/network.tsx     - Search and Instagram icons
app/(tabs)/profile.tsx     - Eye, CreditCard, ChevronRight icons
app/(auth)/_layout.tsx     - Auth stack layout (NEW)
app/(auth)/index.tsx       - Welcome screen (NEW)
app/(auth)/invite.tsx      - Invite code entry (NEW)
app/(auth)/register.tsx    - Registration form (NEW)
```

### Session 1 Files (January 24)

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
