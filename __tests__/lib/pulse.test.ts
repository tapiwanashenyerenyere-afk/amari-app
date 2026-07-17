import {
  normalizePulseText,
  getPulseBlocks,
  getPulseExcerpt,
  getPulseBadgeLabel,
  formatPulseDate,
} from '@/lib/pulse';

describe('normalizePulseText', () => {
  it('rewrites the full "2026 Laureate Class Revealed" phrase, case-insensitively', () => {
    expect(normalizePulseText('the 2026 laureate class revealed')).toBe(
      'Meet the AMARI Gala 2026 nominees',
    );
  });

  it('rewrites a bare "Laureate Class" mention to "AMARI Gala nominees"', () => {
    expect(normalizePulseText('Announcing the Laureate Class')).toBe(
      'Announcing the AMARI Gala nominees',
    );
  });

  it('leaves unrelated text untouched', () => {
    expect(normalizePulseText('Nothing to see here')).toBe('Nothing to see here');
  });
});

describe('getPulseBlocks', () => {
  it('wraps a plain string as a single-item array', () => {
    expect(getPulseBlocks('Hello')).toEqual(['Hello']);
  });

  it('extracts content strings from an array of entries', () => {
    expect(getPulseBlocks([{ content: 'One' }, 'Two', { content: '  ' }])).toEqual(['One', 'Two']);
  });

  it('extracts content from a { blocks: [...] } object', () => {
    const content = { blocks: [{ content: 'Block A' }, { content: 'Block B' }] };
    expect(getPulseBlocks(content)).toEqual(['Block A', 'Block B']);
  });

  it('returns an empty array for null/undefined/unrecognised shapes', () => {
    expect(getPulseBlocks(null)).toEqual([]);
    expect(getPulseBlocks(undefined)).toEqual([]);
    expect(getPulseBlocks({ nothingUseful: true })).toEqual([]);
  });
});

describe('getPulseExcerpt', () => {
  it('prefers the summary_content excerpt over full_content', () => {
    const edition = {
      publish_date: '2026-01-01',
      headline: 'H',
      summary_content: 'Summary first',
      full_content: 'Full second',
    } as any;
    expect(getPulseExcerpt(edition)).toBe('Summary first');
  });

  it('falls back to full_content when there is no summary', () => {
    const edition = {
      publish_date: '2026-01-01',
      headline: 'H',
      full_content: 'Full only',
    } as any;
    expect(getPulseExcerpt(edition)).toBe('Full only');
  });
});

describe('getPulseBadgeLabel', () => {
  it('badges the first item as new, the rest as featured', () => {
    expect(getPulseBadgeLabel(0)).toBe('NEW THIS WEEK');
    expect(getPulseBadgeLabel(1)).toBe('FEATURED');
    expect(getPulseBadgeLabel(5)).toBe('FEATURED');
  });
});

describe('formatPulseDate', () => {
  it('formats an ISO date in en-AU day/month/year style', () => {
    expect(formatPulseDate('2026-03-05')).toBe('5 Mar 2026');
  });
});
