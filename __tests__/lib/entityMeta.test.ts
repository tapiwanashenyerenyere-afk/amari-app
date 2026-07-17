import {
  buildEntityListRows,
  entityIndustryLabel,
  entityKindLabel,
  entityRegionLabel,
  filterEntities,
} from '@/lib/entityMeta';
import type { FollowableEntity } from '@/types/database';

const entities: FollowableEntity[] = [
  { id: 3, kind: 'theme', name: 'Capital access', industry: 'capital', region: 'global' },
  { id: 2, kind: 'person', name: 'Ada Example', industry: 'creative-industries', region: 'uk' },
  { id: 1, kind: 'company', name: 'Airwallex', industry: 'fintech-payments', region: 'australia' },
];

describe('entity catalogue helpers', () => {
  it('filters by friendly category and searches name, industry, and region', () => {
    expect(filterEntities(entities, 'company', '')).toHaveLength(1);
    expect(filterEntities(entities, 'all', 'creative').map((item) => item.id)).toEqual([2]);
    expect(filterEntities(entities, 'all', 'Australia').map((item) => item.id)).toEqual([1]);
  });

  it('sorts stably by name and inserts alphabetical divider rows', () => {
    const rows = buildEntityListRows(filterEntities(entities, 'all', ''));
    expect(rows.map((row) => row.key)).toEqual([
      'divider-A',
      'entity-2',
      'entity-1',
      'divider-C',
      'entity-3',
    ]);
  });

  it('renders friendly kind, industry, and region metadata', () => {
    expect(entityKindLabel('company')).toBe('Organisation');
    expect(entityKindLabel('person')).toBe('Person');
    expect(entityKindLabel('theme')).toBe('Theme');
    expect(entityIndustryLabel('creative-industries')).toBe('Creative Industries');
    expect(entityRegionLabel('uk')).toBe('United Kingdom');
  });
});
