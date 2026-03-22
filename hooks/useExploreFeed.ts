import { useMyProfile } from '@/queries/members';
import { useLatestPulse } from '@/queries/pulse';
import { useEvents } from '@/queries/events';
import { FALLBACK_TILES } from '@/constants/explore';
import type { ExploreTile, ExploreState } from '@/types/explore';

function buildProfileKeywords(profile: any): Set<string> {
  return new Set(
    [
      ...(Array.isArray(profile?.skills) ? profile.skills : []),
      ...(Array.isArray(profile?.interests) ? profile.interests : []),
      profile?.current_project,
      profile?.industry,
      profile?.city,
    ]
      .filter(Boolean)
      .flatMap((value: string) => value.toLowerCase().split(/[^a-z0-9]+/))
      .filter(Boolean)
  );
}

function buildExploreTiles(
  pulse: any,
  events: any[],
  profile: any,
): ExploreTile[] {
  const tiles: ExploreTile[] = [];
  const profileKeywords = buildProfileKeywords(profile);

  // 1. Admin/editorial content from pulse
  if (pulse?.headline) {
    tiles.push({
      id: `pulse-${pulse.id || 'latest'}`,
      type: 'editorial',
      title: pulse.headline,
      description: (typeof pulse.summary_content === 'object' && pulse.summary_content !== null
        ? ((pulse.summary_content as any).blocks || []).map((b: any) => b.content).join(' ')
        : pulse.summary_content) || null,
      image_url: pulse.hero_image_path || null,
      image_path: null,
      tags: [],
      score: 1.0,
      disclosure_label: null,
      tag_label: 'NEW THIS WEEK',
      subtitle: '3 min read \u00b7 Editorial',
      source: 'live',
    });
  }

  // 2. Upcoming events as preview tiles
  const upcomingEvents = (events || []).slice(0, 3);
  upcomingEvents.forEach((event: any, i: number) => {
    const eventDate = event.starts_at ? new Date(event.starts_at) : null;
    const daysAway = eventDate
      ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const eventKeywords = `${event.title || ''} ${event.description || ''} ${event.type || ''}`.toLowerCase();
    const interestBoost = Array.from(profileKeywords).some((keyword) => eventKeywords.includes(keyword)) ? 0.08 : 0;

    tiles.push({
      id: `event-${event.id}`,
      type: 'event_preview',
      title: event.title,
      description: event.description || null,
      image_url: event.cover_image_path || null,
      image_path: null,
      tags: [event.type || 'event'],
      score: 0.9 - i * 0.05 + interestBoost,
      disclosure_label: null,
      tag_label: daysAway !== null ? `${daysAway} DAYS AWAY` : 'UPCOMING',
      subtitle: eventDate
        ? `${eventDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} \u00b7 ${event.venue_name || 'TBA'}`
        : event.venue_name || 'TBA',
      source: 'live',
    });
  });

  // 3. If we have fewer than 3 tiles, add fallback content
  if (tiles.length < 3) {
    const needed = 3 - tiles.length;
    FALLBACK_TILES.slice(0, needed).forEach((fb) => {
      tiles.push({
        ...fb,
        image_url: null,
        image_path: null,
        tags: [],
        score: 0.3,
        disclosure_label: null,
        source: 'fallback',
      });
    });
  }

  tiles.sort((a, b) => b.score - a.score);

  return tiles;
}

export function useExploreFeed(): ExploreState {
  const { data: pulse, isLoading: pulseLoading } = useLatestPulse();
  const { data: events, isLoading: eventsLoading } = useEvents('upcoming');
  const { data: profile } = useMyProfile();

  const isLoading = pulseLoading || eventsLoading;

  if (isLoading) {
    return { tiles: [], isLoading: true, isError: false, source: 'live' };
  }

  const tiles = buildExploreTiles(pulse, events || [], profile);
  const source = tiles.some((t) => t.source === 'live') ? 'live' : 'fallback';

  return {
    tiles,
    isLoading: false,
    isError: false,
    source: source as 'live' | 'fallback',
  };
}
