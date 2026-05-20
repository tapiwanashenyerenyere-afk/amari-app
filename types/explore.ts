export type ExploreTileType = 'admin_pinned' | 'editorial' | 'event_preview' | 'member_project' | 'member_interest' | 'partner' | 'fallback';

export interface ExploreTile {
  id: string;
  type: ExploreTileType;
  title: string;
  description: string | null;
  image_url: string | number | null;
  image_path: string | null;
  tags: string[];
  score: number;
  disclosure_label: string | null; // non-null only for sponsored/partner tiles
  tag_label: string; // e.g. "NEW THIS WEEK", "42 DAYS AWAY", "PINNED"
  subtitle: string | null; // e.g. "3 min read · Editorial", "May 2 · Plaza Ballroom"
  source: 'live' | 'cached' | 'fallback';
}

export interface ExploreState {
  tiles: ExploreTile[];
  isLoading: boolean;
  isError: boolean;
  source: 'live' | 'cached' | 'fallback';
}
