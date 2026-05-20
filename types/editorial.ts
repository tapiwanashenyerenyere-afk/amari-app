export interface EditorialSource {
  label: string;
  url: string;
}

export interface EditorialStory {
  id: string;
  slug: string;
  category: string;
  shortLabel: string;
  signals: string[];
  headline: string;
  summary: string;
  body: string[];
  image: number | null;
  imageCredit: string | null;
  imageAlt: string | null;
  sources: EditorialSource[];
  publishedAt: string;
  amariConnection: string | null;
  featured: boolean;
}

export interface EditorialRecommendation {
  story: EditorialStory;
  score: number;
  matchedSignals: string[];
  reason: string;
}
