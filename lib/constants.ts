// AMARI Design System V7 — WCAG AA verified
// Source: AMARI-Architecture-V2.md Section 12 + amari-v7-chrome.html tokens

export const TIER_LEVELS = {
  member: 1,
  silver: 2,
  platinum: 3,
  laureate: 4,
} as const;

export const TIERS = ['member', 'silver', 'platinum', 'laureate'] as const;
export type MembershipTier = (typeof TIERS)[number];

export const TAB_VISIBILITY: Record<string, number> = {
  pulse: 1,
  events: 1,
  corridor: 2,
  aligned: 3,
  profile: 1,
};

// Colors (V7 WCAG AA verified)
export const C = {
  // Surfaces
  cream: '#f8f6f3',
  creamSoft: '#f2ede6',
  stone: '#e4dcd2',
  stoneDeep: '#d4c9ba',

  // Dark surfaces
  charcoal: '#1a1a1a',
  ink: '#2a2a2a',
  warmBlack: '#111110',

  // Text on cream — verified contrast ratios against #f8f6f3
  textPrimary: '#1a1a1a',    // 14.8:1
  textSecondary: '#4a4541',  // 7.2:1
  textTertiary: '#6b665f',   // 4.6:1 (>=11px)
  textFaint: '#8a857e',      // 3.2:1 (large text only >=18px)
  textGhost: '#c5c0b8',      // 1.5:1 (decorative only)

  // Text on dark — verified against #1a1a1a
  lightPrimary: '#f8f6f3',   // 14.8:1
  lightSecondary: '#c5c0b8', // 8.5:1
  lightTertiary: '#9e9990',  // 5.5:1 (>=11px)
  lightFaint: '#7a756e',     // 3.6:1 (large text only)

  // Borders & surfaces (non-text, no contrast requirement)
  border: 'rgba(26,26,26,0.08)',
  borderLight: 'rgba(26,26,26,0.04)',
  surfaceTint: 'rgba(26,26,26,0.03)',
  darkBorder: 'rgba(248,246,243,0.1)',
  darkSurface: 'rgba(248,246,243,0.05)',

  // Brand
  burgundy: '#722F37',       // 7.5:1 on cream
  bSoft: '#944050',          // 5.1:1 on cream
  gold: '#C9A962',           // 2.7:1 — decorative only
  gWarm: '#b89048',          // 3.1:1 — large text/icons only
  gSoft: '#d4b876',          // 2.3:1 — decorative
  gFaint: 'rgba(201,169,98,0.08)',
  olive: '#6B6B47',          // 4.7:1 on cream
  brass: '#8a7540',          // 4.2:1 on cream

  // Brand on dark
  goldOnDark: '#d4b876',     // 7.5:1 on charcoal
  burgundyOnDark: '#c4707a', // 5.2:1 on charcoal
  oliveOnDark: '#a5a580',    // 5.5:1 on charcoal

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

// Typography — minimum 11px, no exceptions
export const T = {
  // Display
  hero: { fontFamily: 'Syne_800ExtraBold', fontSize: 40, fontWeight: '800' as const, lineHeight: 36, letterSpacing: -2 },
  title: { fontFamily: 'Syne_800ExtraBold', fontSize: 28, fontWeight: '800' as const, lineHeight: 28, letterSpacing: -1 },
  subtitle: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '700' as const, lineHeight: 23, letterSpacing: -0.5 },
  cardTitle: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700' as const, lineHeight: 19.2 },
  cardTitleSm: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700' as const, lineHeight: 17.5 },
  // Body
  body: { fontFamily: 'EBGaramond_400Regular', fontSize: 15, lineHeight: 23 },
  bodySmall: { fontFamily: 'EBGaramond_400Regular', fontSize: 14, lineHeight: 21 },
  bodyItalic: { fontFamily: 'EBGaramond_400Regular_Italic', fontSize: 14, fontStyle: 'italic' as const, lineHeight: 21 },
  // UI
  label: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, fontWeight: '600' as const, letterSpacing: 2, textTransform: 'uppercase' as const },
  labelLg: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, fontWeight: '600' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  meta: { fontFamily: 'DMSans_500Medium', fontSize: 11, letterSpacing: 1, fontWeight: '500' as const },
  stat: { fontFamily: 'Syne_800ExtraBold', fontSize: 22, fontWeight: '800' as const },
  statSm: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700' as const },
  // Navigation
  nav: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  btn: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700' as const, letterSpacing: 2, textTransform: 'uppercase' as const },
} as const;

// Spacing — 4px base grid
export const S = {
  _2: 2, _4: 4, _6: 6, _8: 8, _12: 12,
  _16: 16, _20: 20, _24: 24, _32: 32,
  _40: 40, _48: 48, _56: 56,
} as const;

// Radius — 90-degree corners default per V7 spec
export const R = { none: 0, sm: 4, md: 8, lg: 12, xl: 20, pill: 50 } as const;

// Tier display
export const TIER_DISPLAY_NAMES: Record<string, string> = {
  member: 'Member',
  silver: 'Silver',
  platinum: 'Platinum',
  laureate: 'Laureate',
};

export const TIER_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  member: { bg: C.cream, text: C.textPrimary, accent: C.burgundy },
  silver: { bg: '#C0C0C0', text: C.charcoal, accent: '#A9A9A9' },
  platinum: { bg: '#E5E4E2', text: C.charcoal, accent: '#C0C0C0' },
  laureate: { bg: '#D4AF37', text: C.charcoal, accent: '#B8860B' },
};

// Z-index
export const Z_INDEX = {
  base: 0, dropdown: 10, sticky: 20,
  fixed: 30, modal: 40, popover: 50, toast: 60,
} as const;

// Animation durations (max 200ms for feedback per V7)
export const ANIMATION = { fast: 100, normal: 150, slow: 200 } as const;

// Backward compatibility alias for old components
export const COLORS = {
  charcoal: C.charcoal,
  cream: C.cream,
  burgundy: C.burgundy,
  white: '#ffffff',
  warmGray: C.textFaint,
  border: C.border,
  creamDark: C.creamSoft,
  olive: C.olive,
  gold: C.gold,
  stone: C.stone,
  ink: C.ink,
  charcoalLight: C.ink,
} as const;

// Backward compat type alias
export type TierType = MembershipTier;
