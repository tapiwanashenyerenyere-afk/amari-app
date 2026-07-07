import { feedTagLabel } from '@/constants/feedTags';
import type { FeedInterest, NewsFeedItem } from '@/types/database';

// Format-aware labels for feed items. Read-time is only shown where it is
// honest: video/audio carry a real duration; external articles show source +
// recency instead (we never store their body, so we can't fake a read-time).

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 1) return `${seconds}s`;
  return `${mins} min`;
}

// The short label under a card: "6 min watch" / "6 min listen" for A/V,
// otherwise the recency stamp.
export function formatLabel(item: Pick<NewsFeedItem, 'media_type' | 'duration_seconds' | 'published_at'>): string {
  const dur = formatDuration(item.duration_seconds);
  if (item.media_type === 'video' && dur) return `${dur} watch`;
  if (item.media_type === 'audio' && dur) return `${dur} listen`;
  return timeAgo(item.published_at);
}

// One-line "why you're seeing this" — the premium trust mechanic. Prefers a
// followed-interest match; falls back to the source.
export function reasonLabel(
  item: Pick<NewsFeedItem, 'topics' | 'regions' | 'source_name'>,
  interests: FeedInterest[],
): string {
  const followed = new Set(interests.filter((i) => i.declared).map((i) => i.tag));
  const match = [...item.topics, ...item.regions].find((tag) => followed.has(tag));
  if (match) return `Because you follow ${feedTagLabel(match)}`;
  return `From ${item.source_name}`;
}
