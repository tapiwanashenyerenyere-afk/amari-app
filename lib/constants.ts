// AMARI Design System - DO NOT CHANGE THESE VALUES
// Source: INSTRUCTIONS.md from prototype

export const COLORS = {
  cream: '#f8f6f3',
  creamDark: '#f0ebe4',
  charcoal: '#1a1a1a',
  charcoalLight: '#2d2d2d',
  burgundy: '#722F37',
  olive: '#6B6B47',
  warmGray: '#9a9590',
  border: 'rgba(26, 26, 26, 0.08)',
  white: '#ffffff',
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

export const FONTS = {
  serif: 'EBGaramond',      // Body text, quotes
  display: 'Syne',          // Headings, AMARI wordmark
  sans: 'DMSans',           // UI elements, labels
} as const;

// Membership tiers - NULL means no tier (new member)
export const TIERS = {
  COUNCIL: 'council',       // 9 leaders - special seal, NO QR
  LAUREATE: 'laureate',     // Award winners
  PLATINUM: 'platinum',     // Nominees, major partners
  GOLD: 'gold',             // Significant contributors
  SILVER: 'silver',         // Earned through engagement
  // NULL = no tier yet (new member)
} as const;

export type TierType = typeof TIERS[keyof typeof TIERS] | null;

export const TIER_HIERARCHY: readonly (string | null)[] = [
  'council',
  'laureate',
  'platinum',
  'gold',
  'silver',
  null, // No tier
] as const;

// Check if user can access content requiring a minimum tier
export function canAccessTier(userTier: string | null, requiredTier: string | null): boolean {
  if (requiredTier === null) return true; // No requirement
  if (userTier === null) return false; // User has no tier

  const userIndex = TIER_HIERARCHY.indexOf(userTier);
  const requiredIndex = TIER_HIERARCHY.indexOf(requiredTier);

  return userIndex <= requiredIndex; // Lower index = higher tier
}

// Tier display names
export const TIER_DISPLAY_NAMES: Record<string, string> = {
  council: 'Council',
  laureate: 'Laureate',
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
};

// Tier badge colors
export const TIER_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  council: { bg: COLORS.charcoal, text: COLORS.white, accent: 'rgba(255,255,255,0.3)' },
  laureate: { bg: '#D4AF37', text: COLORS.charcoal, accent: '#B8860B' }, // Gold gradient
  platinum: { bg: '#E5E4E2', text: COLORS.charcoal, accent: '#C0C0C0' }, // Platinum
  gold: { bg: '#FFD700', text: COLORS.charcoal, accent: '#DAA520' },
  silver: { bg: '#C0C0C0', text: COLORS.charcoal, accent: '#A9A9A9' },
};

// Z-index constants (baseline-ui compliant)
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  toast: 60,
} as const;

// Animation durations (baseline-ui compliant - max 200ms for feedback)
export const ANIMATION = {
  fast: 100,
  normal: 150,
  slow: 200,
} as const;
