import { categoryStyle, CATEGORY_STYLES, CATEGORY_ORDER } from '@/lib/projectCategories';

describe('categoryStyle', () => {
  it('returns the matching style for a known category', () => {
    const style = categoryStyle('venture');
    expect(style.label).toBe('Venture');
    expect(style.accent).toBe('#C4A265');
    expect(style.gradient).toHaveLength(3);
  });

  it('falls back to the generic "Project" style for an unrecognised category', () => {
    const style = categoryStyle('not-a-real-category');
    expect(style.label).toBe('Project');
  });

  it('falls back for null and undefined input', () => {
    expect(categoryStyle(null).label).toBe('Project');
    expect(categoryStyle(undefined).label).toBe('Project');
  });
});

describe('CATEGORY_ORDER', () => {
  it('contains every category defined in CATEGORY_STYLES exactly once', () => {
    const styleKeys = Object.keys(CATEGORY_STYLES).sort();
    const orderKeys = [...CATEGORY_ORDER].sort();
    expect(orderKeys).toEqual(styleKeys);
  });

  it('has no duplicate entries', () => {
    expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length);
  });
});
