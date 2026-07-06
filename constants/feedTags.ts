// Tag taxonomy for the intelligence feed. Must stay aligned with the
// classifier taxonomy in supabase/functions/enrich-news/index.ts.

export interface FeedTag {
  tag: string;
  label: string;
}

export const FEED_TOPIC_TAGS: FeedTag[] = [
  { tag: 'entrepreneurship', label: 'Entrepreneurship' },
  { tag: 'creative-industries', label: 'Creative Industries' },
  { tag: 'technology', label: 'Technology' },
  { tag: 'capital', label: 'Capital & Finance' },
  { tag: 'leadership', label: 'Leadership' },
  { tag: 'food-agribusiness', label: 'Food & Agribusiness' },
  { tag: 'property-infrastructure', label: 'Property & Infrastructure' },
  { tag: 'careers-talent', label: 'Careers & Talent' },
  { tag: 'policy', label: 'Policy' },
  { tag: 'culture', label: 'Culture' },
];

export const FEED_REGION_TAGS: FeedTag[] = [
  { tag: 'australia', label: 'Australia' },
  { tag: 'uk', label: 'United Kingdom' },
  { tag: 'africa', label: 'Africa' },
  { tag: 'americas', label: 'Americas' },
];

const TAG_LABELS: Record<string, string> = Object.fromEntries(
  [...FEED_TOPIC_TAGS, ...FEED_REGION_TAGS, { tag: 'global', label: 'Global' }].map((t) => [t.tag, t.label]),
);

export function feedTagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? tag.replace(/-/g, ' ');
}
