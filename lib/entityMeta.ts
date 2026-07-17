import type { FollowableEntity, NewsRegion, TrackedEntityKind } from '@/types/database';

export type EntityFilter = 'all' | TrackedEntityKind;

export type EntityListRow =
  | { type: 'divider'; key: string; label: string }
  | { type: 'entity'; key: string; entity: FollowableEntity };

const REGION_LABELS: Record<NewsRegion, string> = {
  australia: 'Australia',
  uk: 'United Kingdom',
  africa: 'Africa',
  americas: 'Americas',
  global: 'Global',
};

export function entityKindLabel(kind: TrackedEntityKind): string {
  if (kind === 'company') return 'Organisation';
  if (kind === 'theme') return 'Theme';
  return 'Person';
}

export function entityRegionLabel(region: NewsRegion | null): string | null {
  return region ? REGION_LABELS[region] : null;
}

export function entityIndustryLabel(industry: string | null): string | null {
  if (!industry) return null;
  return industry
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function filterEntities(
  entities: FollowableEntity[],
  filter: EntityFilter,
  search: string,
): FollowableEntity[] {
  const query = search.trim().toLocaleLowerCase();
  return entities
    .filter((entity) => filter === 'all' || entity.kind === filter)
    .filter((entity) => {
      if (!query) return true;
      return [entity.name, entity.industry, entityRegionLabel(entity.region)]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query));
    })
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
}

export function buildEntityListRows(entities: FollowableEntity[]): EntityListRow[] {
  const rows: EntityListRow[] = [];
  let lastDivider = '';
  for (const entity of entities) {
    const divider = entity.name.trim().charAt(0).toLocaleUpperCase() || '#';
    if (divider !== lastDivider) {
      rows.push({ type: 'divider', key: `divider-${divider}`, label: divider });
      lastDivider = divider;
    }
    rows.push({ type: 'entity', key: `entity-${entity.id}`, entity });
  }
  return rows;
}
