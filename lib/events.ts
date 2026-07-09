import { colors, TIER_DISPLAY_NAMES } from '@/lib/theme';
import type { Event, EventType, MembershipTier } from '@/types/database';

export type EventFilter = 'all' | EventType;

export const EVENT_TYPES: EventType[] = [
  'gala',
  'networking',
  'dinner',
  'lifestyle',
  'collaboration',
];

export const EVENT_FILTER_OPTIONS: Array<{ label: string; value: EventFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Galas', value: 'gala' },
  { label: 'Networking', value: 'networking' },
  { label: 'Dinners', value: 'dinner' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Collabs', value: 'collaboration' },
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  gala: 'Gala',
  networking: 'Networking',
  dinner: 'Dinner',
  lifestyle: 'Lifestyle',
  collaboration: 'Collaboration',
};

export const EVENT_TYPE_GRADIENTS: Record<EventType, [string, string, string]> = {
  gala: ['#1A1510', colors.black, '#14100C'],
  networking: ['#14182A', '#0E1220', '#181E30'],
  dinner: [colors.tileWine, colors.tileWineDark, '#221418'],
  lifestyle: [colors.cardBase, '#111111', '#1A1510'],
  collaboration: [colors.tileForest, colors.tileForestDark, '#172014'],
};

export const EVENT_TIER_COPY: Record<MembershipTier, string> = {
  member: 'This event is open to all AMARI members.',
  silver: 'Silver membership opens earlier, tighter rooms across curated conversations and partner access.',
  gold: 'Gold membership carries the full AMARI experience: every feature, all content, and priority rooms.',
  platinum: 'Platinum membership unlocks premium tables, partner-led rooms, and higher-trust gatherings.',
  laureate: 'Laureate membership is reserved for the most selective rooms and invitation-led experiences.',
};

export function matchesEventFilter(event: Pick<Event, 'type'>, filter: EventFilter) {
  return filter === 'all' ? true : event.type === filter;
}

export function getEventTypeLabel(type: EventType) {
  return EVENT_TYPE_LABELS[type] ?? type;
}

export function getEventDateParts(startsAt: string) {
  const date = new Date(startsAt);

  return {
    day: date.toLocaleDateString('en-AU', { day: '2-digit' }),
    month: date.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase(),
    year: String(date.getFullYear()),
  };
}

export function getEventTimeLabel(startsAt: string, endsAt: string | null) {
  const starts = new Date(startsAt);
  const startLabel = starts.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (!endsAt) {
    return startLabel;
  }

  const ends = new Date(endsAt);
  const sameDay = starts.toDateString() === ends.toDateString();
  const endLabel = ends.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return sameDay ? `${startLabel} - ${endLabel}` : `${startLabel} onward`;
}

export function getEventRegistrationUrl(
  event: Pick<Event, 'registration_url' | 'eventbrite_id'>,
) {
  const raw = event.registration_url?.trim();
  if (raw) {
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }

  const eventbriteId = event.eventbrite_id?.trim();
  if (!eventbriteId) {
    return null;
  }

  if (eventbriteId.startsWith('http')) {
    return eventbriteId;
  }

  return `https://www.eventbrite.com/e/${eventbriteId}`;
}

export function getTierRequirementLabel(minTier: MembershipTier) {
  return TIER_DISPLAY_NAMES[minTier] ?? minTier.toUpperCase();
}
