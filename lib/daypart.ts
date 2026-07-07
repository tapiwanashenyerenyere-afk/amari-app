// Daypart awareness: the app knows what hour it is and rearranges Pulse
// around it. Pure time logic, no ML — morning leads with the briefing,
// evening leads with rooms and people.

export type Daypart = 'morning' | 'afternoon' | 'evening';

export function getDaypart(date = new Date()): Daypart {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function getDaypartEyebrow(date = new Date()): string {
  const weekday = date
    .toLocaleDateString('en-AU', { weekday: 'long' })
    .toUpperCase();
  const daypart = getDaypart(date).toUpperCase();
  return `${weekday} ${daypart}`;
}

export type PulseSection = 'hero' | 'bridge' | 'editions' | 'briefing';

// Morning: the briefing sits directly under the hero.
// Afternoon: house editorial first, then the briefing.
// Evening: rooms and people first, reading after.
export function getPulseSectionOrder(daypart: Daypart): PulseSection[] {
  switch (daypart) {
    case 'morning':
      return ['hero', 'briefing', 'bridge', 'editions'];
    case 'evening':
      return ['bridge', 'hero', 'editions', 'briefing'];
    default:
      return ['hero', 'bridge', 'editions', 'briefing'];
  }
}
