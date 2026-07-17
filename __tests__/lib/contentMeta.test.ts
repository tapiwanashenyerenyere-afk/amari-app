import { timeAgo, formatDuration, formatLabel, reasonLabel } from '@/lib/contentMeta';

describe('timeAgo', () => {
  it('renders minutes for recent timestamps', () => {
    const iso = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(iso)).toBe('5m ago');
  });

  it('renders hours once past 60 minutes', () => {
    const iso = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(timeAgo(iso)).toBe('3h ago');
  });

  it('renders days once past 24 hours', () => {
    const iso = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(timeAgo(iso)).toBe('2d ago');
  });

  it('floors at 1 minute for anything less than a minute old', () => {
    const iso = new Date(Date.now() - 1000).toISOString();
    expect(timeAgo(iso)).toBe('1m ago');
  });
});

describe('formatDuration', () => {
  it('returns null for missing or non-positive durations', () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
    expect(formatDuration(0)).toBeNull();
    expect(formatDuration(-5)).toBeNull();
  });

  it('renders raw seconds when under a minute', () => {
    expect(formatDuration(10)).toBe('10s');
  });

  it('renders rounded minutes once at or over a minute', () => {
    expect(formatDuration(90)).toBe('2 min');
    expect(formatDuration(360)).toBe('6 min');
  });
});

describe('formatLabel', () => {
  it('labels video items with a duration as a "watch" time', () => {
    const label = formatLabel({ media_type: 'video', duration_seconds: 360, published_at: new Date().toISOString() });
    expect(label).toBe('6 min watch');
  });

  it('labels audio items with a duration as a "listen" time', () => {
    const label = formatLabel({ media_type: 'audio', duration_seconds: 300, published_at: new Date().toISOString() });
    expect(label).toBe('5 min listen');
  });

  it('falls back to a recency stamp for articles with no duration', () => {
    const publishedAt = new Date(Date.now() - 10 * 60000).toISOString();
    const label = formatLabel({ media_type: 'article', duration_seconds: null, published_at: publishedAt });
    expect(label).toBe('10m ago');
  });
});

describe('reasonLabel', () => {
  it('credits an eligible followed entity before any topic match', () => {
    const label = reasonLabel(
      {
        topics: ['technology'],
        regions: ['africa'],
        source_name: 'AMARI Wire',
        matched_entity: 'Flutterwave',
      },
      [{ tag: 'technology', declared: true } as any],
    );
    expect(label).toBe('Because you follow Flutterwave');
  });

  it('credits a followed interest when a topic or region matches', () => {
    const label = reasonLabel(
      { topics: ['technology'], regions: ['australia'], source_name: 'AMARI Wire' },
      [{ tag: 'technology', declared: true } as any],
    );
    expect(label).toBe('Because you follow Technology');
  });

  it('falls back to the source name when no followed interest matches', () => {
    const label = reasonLabel(
      { topics: ['policy'], regions: ['uk'], source_name: 'AMARI Wire' },
      [{ tag: 'technology', declared: true } as any],
    );
    expect(label).toBe('From AMARI Wire');
  });

  it('ignores undeclared interests even if the tag would otherwise match', () => {
    const label = reasonLabel(
      { topics: ['technology'], regions: [], source_name: 'AMARI Wire' },
      [{ tag: 'technology', declared: false } as any],
    );
    expect(label).toBe('From AMARI Wire');
  });
});
