import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPLORE_CACHE_KEY } from '@/constants/explore';
import { TIER_LEVELS } from '@/lib/constants';
import {
  useAlignedDiscoveryTiles,
  type AlignedDiscoveryTile,
} from '@/queries/aligned';
import { useEvents } from '@/queries/events';
import { useMyProfile } from '@/queries/members';
import { useLatestPulse } from '@/queries/pulse';
import type { MembershipTier } from '@/types/db-helpers';
import type { ExploreTile, ExploreState } from '@/types/explore';

interface ExploreProfile {
  skills?: string[] | null;
  interests?: string[] | null;
  current_project?: string | null;
  industry?: string | null;
  city?: string | null;
  tier?: MembershipTier | null;
}

interface PulseEdition {
  id?: number | null;
  headline?: string | null;
  summary_content?: unknown;
  hero_image_path?: string | null;
}

interface EventPreview {
  id: number;
  title: string | null;
  description: string | null;
  cover_image_path: string | null;
  type: string | null;
  starts_at: string | null;
  venue_name: string | null;
}

interface CachedExploreFeed {
  tiles: ExploreTile[];
  cached_at: string;
}

function toKeywords(values: Array<string | null | undefined>): string[] {
  return values
    .flatMap((value) => (value ?? '').toLowerCase().split(/[^a-z0-9]+/))
    .filter(Boolean);
}

function buildProfileKeywords(profile: ExploreProfile | null | undefined): Set<string> {
  return new Set(
    toKeywords([
      ...(Array.isArray(profile?.skills) ? profile.skills : []),
      ...(Array.isArray(profile?.interests) ? profile.interests : []),
      profile?.current_project,
      profile?.industry,
      profile?.city,
    ]),
  );
}

function extractPulseSummary(summaryContent: unknown): string | null {
  if (typeof summaryContent === 'string') {
    return summaryContent;
  }

  if (
    typeof summaryContent === 'object' &&
    summaryContent !== null &&
    'blocks' in summaryContent &&
    Array.isArray((summaryContent as { blocks?: unknown[] }).blocks)
  ) {
    const blocks = (summaryContent as { blocks: Array<{ content?: string | null }> }).blocks;

    return blocks
      .map((block) => block.content?.trim())
      .filter(Boolean)
      .join(' ');
  }

  return null;
}

function clampText(text: string, maxLength = 72): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}\u2026`;
}

function tierBoost(tier: MembershipTier): number {
  if (tier === 'laureate') return 0.08;
  if (tier === 'platinum') return 0.05;
  if (tier === 'silver') return 0.03;
  return 0;
}

function overlapKeywords(
  profileKeywords: Set<string>,
  values: Array<string | null | undefined>,
): string[] {
  const seen = new Set<string>();

  return toKeywords(values).filter((keyword) => {
    if (!profileKeywords.has(keyword) || seen.has(keyword)) {
      return false;
    }

    seen.add(keyword);
    return true;
  });
}

function buildEditorialTile(pulse: PulseEdition | null | undefined): ExploreTile[] {
  if (!pulse?.headline) {
    return [];
  }

  return [
    {
      id: `pulse-${pulse.id ?? 'latest'}`,
      type: 'editorial',
      title: pulse.headline,
      description: extractPulseSummary(pulse.summary_content),
      image_url: pulse.hero_image_path ?? null,
      image_path: null,
      tags: ['pulse', 'editorial'],
      score: 1,
      disclosure_label: null,
      tag_label: 'NEW THIS WEEK',
      subtitle: '3 min read \u00b7 Editorial',
      source: 'live',
    },
  ];
}

function buildEventTiles(
  events: EventPreview[],
  profileKeywords: Set<string>,
): ExploreTile[] {
  return events.slice(0, 3).map((event, index) => {
    const eventDate = event.starts_at ? new Date(event.starts_at) : null;
    const daysAway = eventDate
      ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const matches = overlapKeywords(profileKeywords, [
      event.title,
      event.description,
      event.type,
      event.venue_name,
    ]);
    const scoreBoost = Math.min(matches.length * 0.05, 0.12);

    return {
      id: `event-${event.id}`,
      type: 'event_preview',
      title: event.title ?? 'Upcoming event',
      description: event.description,
      image_url: event.cover_image_path ?? null,
      image_path: null,
      tags: [event.type ?? 'event'],
      score: 0.9 - index * 0.06 + scoreBoost,
      disclosure_label: null,
      tag_label: daysAway !== null ? `${daysAway} DAYS AWAY` : 'UPCOMING',
      subtitle: eventDate
        ? `${eventDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} \u00b7 ${event.venue_name ?? 'TBA'}`
        : event.venue_name ?? 'TBA',
      source: 'live',
    };
  });
}

function buildAlignedTile(
  tile: AlignedDiscoveryTile,
  profileKeywords: Set<string>,
  index: number,
): ExploreTile {
  const matches = overlapKeywords(profileKeywords, [
    tile.description,
    tile.location,
    ...tile.tags,
  ]);
  const matchSummary =
    matches.length > 0
      ? `Shared: ${matches.slice(0, 2).join(', ')}`
      : tile.location
        ? `${tile.location} \u00b7 AMARI member`
        : 'AMARI member match';
  const baseScore = tile.type === 'project' ? 0.82 : 0.76;
  const keywordBoost = Math.min(matches.length * 0.06, 0.18);

  return {
    id: `aligned-${tile.id}`,
    type: tile.type === 'project' ? 'member_project' : 'member_interest',
    title: clampText(tile.description),
    description: tile.description,
    image_url: tile.image_url,
    image_path: tile.image_path,
    tags: tile.tags,
    score: baseScore - index * 0.03 + keywordBoost + tierBoost(tile.owner_tier),
    disclosure_label: null,
    tag_label: tile.type === 'project' ? 'PROJECT MATCH' : 'INTEREST MATCH',
    subtitle: matchSummary,
    source: 'live',
  };
}

function buildAlignedTiles(
  projectTiles: AlignedDiscoveryTile[],
  interestTiles: AlignedDiscoveryTile[],
  profileKeywords: Set<string>,
): ExploreTile[] {
  return [
    ...projectTiles.map((tile, index) => buildAlignedTile(tile, profileKeywords, index)),
    ...interestTiles.map((tile, index) => buildAlignedTile(tile, profileKeywords, index)),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function dedupeTiles(tiles: ExploreTile[]): ExploreTile[] {
  const seen = new Set<string>();

  return tiles.filter((tile) => {
    if (seen.has(tile.id)) {
      return false;
    }

    seen.add(tile.id);
    return true;
  });
}

export function useExploreFeed(): ExploreState {
  const [cachedTiles, setCachedTiles] = useState<ExploreTile[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const { data: pulse, isLoading: pulseLoading, isError: pulseError } = useLatestPulse();
  const { data: events, isLoading: eventsLoading, isError: eventsError } = useEvents('upcoming');
  const { data: profile } = useMyProfile();
  const profileTier = (profile as ExploreProfile | undefined)?.tier;
  const alignedEnabled =
    (profileTier ? TIER_LEVELS[profileTier] : 0) >= TIER_LEVELS.platinum;
  const {
    data: projectTiles = [],
    isError: projectsError,
  } = useAlignedDiscoveryTiles('project', { enabled: alignedEnabled, limit: 4 });
  const {
    data: interestTiles = [],
    isError: interestsError,
  } = useAlignedDiscoveryTiles('interest', { enabled: alignedEnabled, limit: 4 });

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(EXPLORE_CACHE_KEY)
      .then((stored) => {
        if (!active || !stored) {
          return;
        }

        const parsed = JSON.parse(stored) as CachedExploreFeed;
        if (Array.isArray(parsed.tiles)) {
          setCachedTiles(
            parsed.tiles.map((tile) => ({
              ...tile,
              source: 'cached',
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setCacheLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const organicTiles = useMemo(() => {
    const profileKeywords = buildProfileKeywords(profile as ExploreProfile | undefined);

    return dedupeTiles(
      [
        ...buildEditorialTile(pulse as PulseEdition | undefined),
        ...buildEventTiles((events ?? []) as EventPreview[], profileKeywords),
        ...buildAlignedTiles(projectTiles, interestTiles, profileKeywords),
      ].sort((a, b) => b.score - a.score),
    );
  }, [events, interestTiles, profile, projectTiles, pulse]);

  useEffect(() => {
    if (organicTiles.length === 0) {
      return;
    }

    const payload: CachedExploreFeed = {
      tiles: organicTiles,
      cached_at: new Date().toISOString(),
    };

    AsyncStorage.setItem(EXPLORE_CACHE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [organicTiles]);

  const isLoading =
    (pulseLoading || eventsLoading) && !cacheLoaded && cachedTiles.length === 0;
  const isError = pulseError || eventsError || projectsError || interestsError;

  if (isLoading) {
    return { tiles: [], isLoading: true, isError: false, source: 'live' };
  }

  if (organicTiles.length > 0) {
    return {
      tiles: organicTiles,
      isLoading: false,
      isError,
      source: 'live',
    };
  }

  if (cachedTiles.length > 0) {
    return {
      tiles: cachedTiles,
      isLoading: false,
      isError,
      source: 'cached',
    };
  }

  return {
    tiles: [],
    isLoading: false,
    isError,
    source: 'fallback',
  };
}
