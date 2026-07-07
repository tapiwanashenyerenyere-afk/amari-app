import type { ProjectCategory } from '@/types/database';

// Shared category identity — colours for cover fallbacks, cluster markers,
// and shelves. One source of truth so the map and the browse surface agree.
export interface CategoryStyle {
  label: string;
  accent: string;
  gradient: [string, string, string];
}

export const CATEGORY_STYLES: Record<ProjectCategory, CategoryStyle> = {
  venture: { label: 'Venture', accent: '#C4A265', gradient: ['#1C1815', '#0F0D0A', '#141210'] },
  advisory: { label: 'Advisory', accent: '#B0707A', gradient: ['#1F1418', '#180E12', '#221419'] },
  creative: { label: 'Creative', accent: '#8CAAD2', gradient: ['#141822', '#0E1218', '#161B26'] },
  impact: { label: 'Impact', accent: '#78B482', gradient: ['#141F17', '#0E1810', '#172014'] },
  culture: { label: 'Culture', accent: '#C48A6E', gradient: ['#1E1712', '#14100C', '#221913'] },
  health: { label: 'Health', accent: '#7FB8B0', gradient: ['#121E1D', '#0C1615', '#152321'] },
  tech: { label: 'Tech', accent: '#9B93C4', gradient: ['#16151F', '#100F17', '#1B1926'] },
};

const FALLBACK: CategoryStyle = {
  label: 'Project',
  accent: '#8B7355',
  gradient: ['#1A1510', '#0F0A06', '#1C1510'],
};

export function categoryStyle(category: string | null | undefined): CategoryStyle {
  if (category && category in CATEGORY_STYLES) {
    return CATEGORY_STYLES[category as ProjectCategory];
  }
  return FALLBACK;
}

// Ordered categories for building shelves.
export const CATEGORY_ORDER: ProjectCategory[] = [
  'venture',
  'creative',
  'culture',
  'tech',
  'impact',
  'advisory',
  'health',
];
