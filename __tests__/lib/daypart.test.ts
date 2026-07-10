import { getDaypart, getDaypartEyebrow, getPulseSectionOrder } from '@/lib/daypart';

function atHour(hour: number, minute = 0): Date {
  // Fixed calendar date (a Wednesday), only the hour/minute matters for these tests.
  return new Date(2026, 6, 8, hour, minute, 0);
}

describe('getDaypart', () => {
  it('classifies just before noon as morning', () => {
    expect(getDaypart(atHour(11, 59))).toBe('morning');
  });

  it('classifies exactly noon as afternoon (morning upper bound is exclusive)', () => {
    expect(getDaypart(atHour(12, 0))).toBe('afternoon');
  });

  it('classifies just before 5pm as afternoon', () => {
    expect(getDaypart(atHour(16, 59))).toBe('afternoon');
  });

  it('classifies exactly 5pm as evening', () => {
    expect(getDaypart(atHour(17, 0))).toBe('evening');
  });

  it('classifies midnight as morning', () => {
    expect(getDaypart(atHour(0))).toBe('morning');
  });
});

describe('getDaypartEyebrow', () => {
  it('formats as "WEEKDAY DAYPART" in en-AU', () => {
    // 8 July 2026 is a Wednesday.
    expect(getDaypartEyebrow(atHour(9))).toBe('WEDNESDAY MORNING');
  });

  it('reflects the evening daypart for a late hour', () => {
    expect(getDaypartEyebrow(atHour(20))).toBe('WEDNESDAY EVENING');
  });
});

describe('getPulseSectionOrder', () => {
  it('leads with the hero in the morning, but keeps briefing in slot two', () => {
    expect(getPulseSectionOrder('morning')).toEqual(['hero', 'briefing', 'bridge', 'editions']);
  });

  it('leads with bridge in the evening, but still keeps briefing in slot two', () => {
    expect(getPulseSectionOrder('evening')).toEqual(['bridge', 'briefing', 'hero', 'editions']);
  });

  it('falls back to the morning-style order for afternoon', () => {
    expect(getPulseSectionOrder('afternoon')).toEqual(['hero', 'briefing', 'bridge', 'editions']);
  });

  it('never lets the briefing sit below the second slot in any daypart', () => {
    (['morning', 'afternoon', 'evening'] as const).forEach((daypart) => {
      expect(getPulseSectionOrder(daypart).indexOf('briefing')).toBeLessThanOrEqual(1);
    });
  });
});
