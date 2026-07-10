import {
  matchesEventFilter,
  getEventTypeLabel,
  getEventDateParts,
  getEventTimeLabel,
  getEventRegistrationUrl,
  getTierRequirementLabel,
} from '@/lib/events';

describe('matchesEventFilter', () => {
  it('matches any event type when the filter is "all"', () => {
    expect(matchesEventFilter({ type: 'gala' }, 'all')).toBe(true);
    expect(matchesEventFilter({ type: 'dinner' }, 'all')).toBe(true);
  });

  it('matches only the same event type when a specific filter is set', () => {
    expect(matchesEventFilter({ type: 'gala' }, 'gala')).toBe(true);
    expect(matchesEventFilter({ type: 'dinner' }, 'gala')).toBe(false);
  });
});

describe('getEventTypeLabel', () => {
  it('returns the human label for a known type', () => {
    expect(getEventTypeLabel('networking')).toBe('Networking');
    expect(getEventTypeLabel('collaboration')).toBe('Collaboration');
  });
});

describe('getEventDateParts', () => {
  it('splits an ISO timestamp into day/month/year parts', () => {
    // Use midday UTC so local-timezone shifts can't roll the calendar date.
    const parts = getEventDateParts('2026-11-25T12:00:00Z');
    expect(parts.day).toBe('25');
    expect(parts.month).toBe('NOV');
    expect(parts.year).toBe('2026');
  });
});

describe('getEventTimeLabel', () => {
  it('renders a start-end range on the same day', () => {
    const label = getEventTimeLabel('2026-11-25T18:00:00', '2026-11-25T21:00:00');
    expect(label).toContain(' - ');
    expect(label.startsWith('6:00')).toBe(true);
  });

  it('renders "onward" when the event ends on a later day', () => {
    const label = getEventTimeLabel('2026-11-25T18:00:00', '2026-11-26T02:00:00');
    expect(label).toBe('6:00 pm onward');
  });

  it('renders just the start time when there is no end time', () => {
    const label = getEventTimeLabel('2026-11-25T18:00:00', null);
    expect(label).toBe('6:00 pm');
  });
});

describe('getEventRegistrationUrl', () => {
  it('prefixes a bare host with https://', () => {
    expect(getEventRegistrationUrl({ registration_url: 'example.com/rsvp', eventbrite_id: null }))
      .toBe('https://example.com/rsvp');
  });

  it('leaves a fully-qualified registration_url untouched', () => {
    expect(getEventRegistrationUrl({ registration_url: 'http://example.com/rsvp', eventbrite_id: null }))
      .toBe('http://example.com/rsvp');
  });

  it('builds an Eventbrite URL from a bare eventbrite_id when no registration_url is set', () => {
    expect(getEventRegistrationUrl({ registration_url: null, eventbrite_id: '123456789' }))
      .toBe('https://www.eventbrite.com/e/123456789');
  });

  it('returns null when neither field is present', () => {
    expect(getEventRegistrationUrl({ registration_url: null, eventbrite_id: null })).toBeNull();
  });
});

describe('getTierRequirementLabel', () => {
  it('returns the display name for a known tier', () => {
    expect(getTierRequirementLabel('gold')).toBe('GOLD MEMBER');
  });
});
