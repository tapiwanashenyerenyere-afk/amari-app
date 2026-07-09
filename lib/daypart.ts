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

// The briefing never sits below the second slot — members should always
// find it without hunting, at any hour. Daypart still sets the lead:
// mornings open on the hero, evenings on rooms and people.
export function getPulseSectionOrder(daypart: Daypart): PulseSection[] {
  switch (daypart) {
    case 'morning':
      return ['hero', 'briefing', 'bridge', 'editions'];
    case 'evening':
      return ['bridge', 'briefing', 'hero', 'editions'];
    default:
      return ['hero', 'briefing', 'bridge', 'editions'];
  }
}
