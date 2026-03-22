import type { MembershipTier } from '@/types/db-helpers';

export interface TierCardStyle {
  backgroundColor?: string;
  gradientColors?: readonly string[];
  borderColor: string;
  shadowColor: string;
  shadowOpacity: number;
  textColor: string;
  secondaryText: string;
  faintText: string;
  accent: string;
  avatarBackground: string;
  avatarText: string;
  avatarRing: string;
  qrBlock: string;
  qrColor: string;
  emblemColor: string;
  emblemOpacity: number;
  tierPillBackground: string;
  sweepOpacity: number;
  showCornerMarks: boolean;
}

export const TIER_CARD_STYLES: Record<MembershipTier, TierCardStyle> = {
  laureate: {
    gradientColors: ['#D4B86A', '#C9A962', '#B89845', '#D4BC6F', '#C9A962', '#A8893A'],
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#A0823C',
    shadowOpacity: 0.25,
    textColor: '#2A1F0A',
    secondaryText: 'rgba(42,31,10,0.55)',
    faintText: 'rgba(42,31,10,0.3)',
    accent: '#8B6A23',
    avatarBackground: '#2A1F0A',
    avatarText: '#C9A962',
    avatarRing: 'rgba(42,31,10,0.15)',
    qrBlock: 'rgba(42,31,10,0.06)',
    qrColor: 'rgba(42,31,10,0.78)',
    emblemColor: '#FFF8E6',
    emblemOpacity: 0.1,
    tierPillBackground: 'rgba(42,31,10,0.12)',
    sweepOpacity: 0.12,
    showCornerMarks: true,
  },
  platinum: {
    gradientColors: ['#1A1A1A', '#252525', '#1E1E1E', '#1A1A1A', '#141414', '#1A1A1A'],
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    textColor: '#F8F6F3',
    secondaryText: 'rgba(248,246,243,0.45)',
    faintText: 'rgba(248,246,243,0.22)',
    accent: '#C9A962',
    avatarBackground: '#F8F6F3',
    avatarText: '#1A1A1A',
    avatarRing: 'rgba(248,246,243,0.15)',
    qrBlock: 'rgba(248,246,243,0.04)',
    qrColor: 'rgba(248,246,243,0.72)',
    emblemColor: '#FFFFFF',
    emblemOpacity: 0.05,
    tierPillBackground: 'rgba(248,246,243,0.08)',
    sweepOpacity: 0.05,
    showCornerMarks: false,
  },
  silver: {
    gradientColors: ['#C0C0C8', '#B0B0B8', '#D0D0D6', '#A8A8B2', '#C4C4CC', '#CCCCD4'],
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    textColor: '#1A1A24',
    secondaryText: 'rgba(37,37,48,0.55)',
    faintText: 'rgba(37,37,48,0.25)',
    accent: '#722F37',
    avatarBackground: '#252530',
    avatarText: '#D0D0D6',
    avatarRing: 'rgba(37,37,48,0.12)',
    qrBlock: 'rgba(37,37,48,0.05)',
    qrColor: 'rgba(37,37,48,0.68)',
    emblemColor: '#252530',
    emblemOpacity: 0.06,
    tierPillBackground: 'rgba(37,37,48,0.08)',
    sweepOpacity: 0.15,
    showCornerMarks: false,
  },
  member: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    textColor: '#1A1A1A',
    secondaryText: '#8A8580',
    faintText: 'rgba(0,0,0,0.15)',
    accent: '#722F37',
    avatarBackground: '#1A1A1A',
    avatarText: '#F8F6F3',
    avatarRing: 'rgba(0,0,0,0.06)',
    qrBlock: 'rgba(0,0,0,0.02)',
    qrColor: 'rgba(26,26,26,0.68)',
    emblemColor: '#1A1A1A',
    emblemOpacity: 0.03,
    tierPillBackground: 'rgba(0,0,0,0.03)',
    sweepOpacity: 0,
    showCornerMarks: false,
  },
};

export const CARD_TIER_LABELS: Record<MembershipTier, string> = {
  member: 'MEMBER',
  silver: 'SILVER',
  platinum: 'PLATINUM',
  laureate: 'LAUREATE',
};
