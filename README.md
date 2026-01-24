# AMARI Mobile App

An **invite-only, gated community mobile app** for the African diaspora professional community. Built with React Native (Expo).

## Key Principles

- **Membership is EARNED, not given** - No default tier, new members have NULL tier
- **AMARI curates all content** - No user-generated content
- **Privacy by default** - Mutual consent connections, visibility toggles
- **No gender fields** - Names only throughout
- **Premium experience** - Luxury aesthetic, no cheap promo spam

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | Expo SDK 54 |
| Navigation | Expo Router |
| State | Zustand + TanStack Query |
| Animations | Reanimated 3 |
| QR Codes | react-native-qrcode-svg |

## Tab Structure

```
┌────────┬────────────┬────────┬─────────┬─────────┐
│  Home  │  Discover  │ Events │ Network │ Profile │
└────────┴────────────┴────────┴─────────┴─────────┘
```

### Home
- AMARI Gala countdown (prominent)
- Next major event
- Connections summary
- Announcements

### Discover (AMARI-Curated Only)
- Laureate Spotlight (weekly rotation)
- AMARI News
- Partner Spotlight
- Community Achievements
- Partners directory

### Events
- Your tickets with QR codes
- Upcoming events (tier-gated)
- Invite-only section
- Past events

### Network
- Search by tags
- AI matching: "People like me", "Complementary skills"
- Connections list
- Pending requests (mutual consent)
- Instagram feed (@amaborogroup)

### Profile
- Avatar + Name (NO gender)
- Tier badge (or empty if no tier)
- "What I'm building"
- "Interested in" tags
- "Open to" collaboration types
- Visibility toggles per section
- Membership card link

## Membership Tiers

```
Council (9 people)  → SEAL, no QR code
Laureate            → Award winners, gold gradient
Platinum            → Nominees, major partners
Gold                → Significant contributors
Silver              → Earned through engagement
NULL (New Member)   → No badge, hasn't earned tier yet
```

## Design System

### Colors
```javascript
cream: '#f8f6f3'
creamDark: '#f0ebe4'
charcoal: '#1a1a1a'
charcoalLight: '#2d2d2d'
burgundy: '#722F37'
olive: '#6B6B47'
warmGray: '#9a9590'
```

### Typography
- **Serif** (EB Garamond): Body text, quotes
- **Display** (Syne): Headings, AMARI wordmark
- **Sans** (DM Sans): UI elements, labels

## Project Structure

```
amari-mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with React Query
│   └── (tabs)/            # Bottom tab navigator
│       ├── _layout.tsx    # Tab configuration
│       ├── index.tsx      # Home screen
│       ├── discover.tsx   # Discover screen
│       ├── events.tsx     # Events screen
│       ├── network.tsx    # Network screen
│       └── profile.tsx    # Profile screen
├── components/
│   └── cards/
│       └── MembershipCard.tsx  # Card with QR/Council Seal
├── lib/
│   ├── constants.ts       # Design system tokens
│   └── barcode.ts         # Member barcode generation
├── stores/                # Zustand stores (TBD)
├── types/                 # TypeScript types (TBD)
└── assets/               # Images, fonts
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on web
npx expo start --web

# Run on iOS/Android
# Scan QR code with Expo Go app
```

## Year 1 Exclusions (DO NOT BUILD)

- ❌ In-app messaging (use email/LinkedIn)
- ❌ User-generated content
- ❌ Promo codes / discounts
- ❌ Public profiles outside app
- ❌ Gender fields

## Development Status

### Phase 1: Foundation ✅
- [x] Expo project setup
- [x] 5-tab navigation
- [x] Design system constants
- [x] Home screen with countdown
- [x] Discover screen (AMARI-curated)
- [x] Events screen (tier-gated)
- [x] Network screen (connections)
- [x] Profile screen (visibility toggles)
- [x] Membership card component
- [x] Barcode generation utility

### Phase 2: Core Features (Next)
- [ ] Auth screens (invite code flow)
- [ ] Backend API (Hono.js)
- [ ] Database setup (PostgreSQL + pgvector)
- [ ] Real data integration
- [ ] QR code scanning for events

## Build Date

January 24, 2026

## License

Private - AMARI Group
