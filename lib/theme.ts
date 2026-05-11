// AMARI V2 Design System — Blank Street × Cosmos × Print Monograph
// Three-color palette: black, white, sandstone on bone canvas
// Dark cinematic onboarding → warm light editorial app

// ─── Colors ───────────────────────────────────────────────
export const colors = {
  // Core palette — ONLY these three plus functional grays
  black: '#0A0A0A',
  white: '#FFFFFF',
  sand: '#8B7355',          // Darkened from #A0856B for WCAG AA on bone (4.54:1)

  // Backgrounds
  bone: '#F2EDE6',          // App canvas (warm off-white)
  cream: '#FDFCFA',
  warm: '#EDE7DE',
  onboard: '#0A0A0A',       // Onboarding dark screens
  void: '#000000',           // Step 0

  // Sand variations (adjusted for darker base)
  sandLight: 'rgba(139, 115, 85, 0.12)',
  sandDim: 'rgba(139, 115, 85, 0.5)',
  sandSubtle: 'rgba(139, 115, 85, 0.18)',
  sandOnDark: '#C4A882',    // Lighter sand for dark backgrounds (5.8:1 on #111)

  // Grays
  gray: '#767676',           // Darkened from #999 for WCAG AA on white (4.54:1)
  grayLight: '#8A8A8A',
  grayGhost: '#C9C9C9',

  // Functional
  ghost: 'rgba(0, 0, 0, 0.04)',
  rule: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.35)',

  // Tier accent colors
  tierPlatinum: '#722F37',
  tierSilver: '#9898a0',

  // Badge colors
  badgeGreen: 'rgba(92,109,79,0.08)',
  badgeGreenText: '#5c6d4f',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // Profile redesign accents
  gold: '#C4A265',
  goldLight: '#D4B87A',
  goldDark: '#A8884F',
  cardBase: '#1C1C1C',
  cardDark: '#0F0F0F',
  cardWarm: '#1A1510',
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
  overlayHeavy: 'rgba(5,5,5,0.97)',
} as const;

// ─── Typography ───────────────────────────────────────────
export const typography = {
  // Plus Jakarta Sans — app-wide titles and editorial emphasis
  serif: {
    regular: 'PlusJakartaSans_500Medium',
    italic: 'PlusJakartaSans_400Regular_Italic',
    medium: 'PlusJakartaSans_600SemiBold',
    semiBold: 'PlusJakartaSans_700Bold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_700Bold',
  },

  // Plus Jakarta Sans — UI labels, tabs, and navigation
  geo: {
    regular: 'PlusJakartaSans_600SemiBold',
    medium: 'PlusJakartaSans_700Bold',
    semiBold: 'PlusJakartaSans_700Bold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_700Bold',
  },

  // Plus Jakarta Sans — Body text, descriptions, buttons
  body: {
    light: 'PlusJakartaSans_300Light',
    regular: 'PlusJakartaSans_500Medium',
    medium: 'PlusJakartaSans_600SemiBold',
    semiBold: 'PlusJakartaSans_700Bold',
    bold: 'PlusJakartaSans_700Bold',
    lightItalic: 'PlusJakartaSans_300Light_Italic',
    italic: 'PlusJakartaSans_500Medium_Italic',
  },

  // JetBrains Mono — Metadata, dates, codes, tier badges
  mono: {
    light: 'JetBrainsMono_300Light',
    regular: 'JetBrainsMono_500Medium',
    medium: 'JetBrainsMono_500Medium',
  },

  // Scale
  sizes: {
    screenTitle: 26,
    alignedTitle: 32,
    listTitle: 28,
    cardTitle: 18,
    sectionLabel: 11,     // Bumped from 10 for readability
    body: 13,
    bodySmall: 12,
    meta: 11,
    caption: 10,          // Bumped from 9 for accessibility
    tiny: 9,              // Bumped from 8 for low-vision users
  },

  // Letter spacing
  spacing: {
    sectionLabel: 3,
    badge: 1.5,
    mono: 1,
    tabLabel: 0.5,
  },
} as const;

// ─── Spacing (8px grid) ──────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,      // Screen horizontal padding
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Radius ──────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

// ─── Shadows ─────────────────────────────────────────────
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

// ─── Tier System ─────────────────────────────────────────
export const TIER_LEVELS = {
  member: 1,
  silver: 2,
  platinum: 3,
  laureate: 4,
} as const;

export const TIERS = ['member', 'silver', 'platinum', 'laureate'] as const;
export type MembershipTier = (typeof TIERS)[number];

export const TIER_DISPLAY_NAMES: Record<string, string> = {
  member: 'MEMBER',
  silver: 'SILVER MEMBER',
  platinum: 'PLATINUM MEMBER',
  laureate: 'LAUREATE',
};

export const TAB_VISIBILITY: Record<string, number> = {
  pulse: 1,
  events: 1,
  aligned: 3,
  corridor: 99,
  profile: 1,
};
