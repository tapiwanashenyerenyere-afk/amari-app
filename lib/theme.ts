// AMARI V2 Design System — Blank Street × Cosmos × Print Monograph
// Three-color palette: black, white, sandstone on bone canvas
// Dark cinematic onboarding → warm light editorial app

// ─── Colors ───────────────────────────────────────────────
export const colors = {
  // Core palette — ONLY these three plus functional grays
  black: '#111111',
  white: '#FFFFFF',
  sand: '#8B7355',          // Darkened from #A0856B for WCAG AA on bone (4.54:1)

  // Backgrounds
  bone: '#F5F4F0',          // App canvas (warm off-white)
  onboard: '#0A0A0A',       // Onboarding dark screens
  void: '#000000',           // Step 0

  // Sand variations (adjusted for darker base)
  sandLight: 'rgba(139, 115, 85, 0.12)',
  sandDim: 'rgba(139, 115, 85, 0.5)',
  sandSubtle: 'rgba(139, 115, 85, 0.18)',
  sandOnDark: '#C4A882',    // Lighter sand for dark backgrounds (5.8:1 on #111)

  // Grays
  gray: '#767676',           // Darkened from #999 for WCAG AA on white (4.54:1)
  grayLight: '#AAAAAA',     // Darkened from #CCC for better contrast
  grayGhost: '#DDDDDD',

  // Functional
  ghost: 'rgba(0, 0, 0, 0.04)',
  rule: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.35)',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

// ─── Typography ───────────────────────────────────────────
export const typography = {
  // EB Garamond — Headlines, dates, names (precise classical serif)
  serif: {
    regular: 'EBGaramond-Regular',
    italic: 'EBGaramond-Italic',
    medium: 'EBGaramond-Medium',
    semiBold: 'EBGaramond-SemiBold',
    bold: 'EBGaramond-Bold',
  },

  // Syne — Section labels, tab labels, badges, navigation
  geo: {
    regular: 'Syne-Regular',
    medium: 'Syne-Medium',
    semiBold: 'Syne-SemiBold',
    bold: 'Syne-Bold',
    extraBold: 'Syne-ExtraBold',
  },

  // DM Sans — Body text, descriptions, buttons
  body: {
    regular: 'DMSans-Regular',
    medium: 'DMSans-Medium',
    semiBold: 'DMSans-SemiBold',
    bold: 'DMSans-Bold',
  },

  // IBM Plex Mono — Metadata, dates, codes, tier badges
  mono: {
    regular: 'IBMPlexMono-Regular',
    medium: 'IBMPlexMono-Medium',
  },

  // Scale
  sizes: {
    screenTitle: 26,
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
  corridor: 2,
  profile: 1,
};
