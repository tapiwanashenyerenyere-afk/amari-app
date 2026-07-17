import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('entity following mobile surface', () => {
  const sheet = read('components/pulse/EntityFollowSheet.tsx');
  const actions = read('components/pulse/BriefingActionRow.tsx');
  const preview = read('components/pulse/BriefingPreview.tsx');
  const full = read('app/briefing.tsx');
  const queries = read('queries/news.ts');

  it('launches the same two actions from preview and full briefing', () => {
    expect(actions).toContain('Tune interests');
    expect(actions).toContain('Follow your world');
    expect(preview).toContain('<BriefingActionRow');
    expect(full).toContain('<BriefingActionRow');
    expect(preview).toContain('<EntityFollowSheet');
    expect(full).toContain('<EntityFollowSheet');
  });

  it('uses a full-screen, keyboard-safe, non-autofocused searchable catalogue', () => {
    expect(sheet).toContain('presentationStyle="fullScreen"');
    expect(sheet).toContain('animationType="slide"');
    expect(sheet).toContain('onRequestClose={onClose}');
    expect(sheet).toContain('<KeyboardAvoidingView');
    expect(sheet).toContain('autoFocus={false}');
    expect(sheet).toContain('maxWidth: 640');
  });

  it('covers filters, counts, dividers, refresh, empty, no-match, and failure states', () => {
    for (const copy of [
      "label: 'All'",
      "label: 'People'",
      "label: 'Organisations'",
      "label: 'Themes'",
      "type === 'divider'",
      'followedCount',
      'Loading your world…',
      'Nothing to follow yet.',
      'No matches.',
      'Your follow settings didn’t load.',
      'Showing the last confirmed list.',
    ]) expect(sheet).toContain(copy);
  });

  it('makes each complete row one accessible switch with fixed pending state', () => {
    expect(sheet).toContain('accessibilityRole="switch"');
    expect(sheet).toContain('accessibilityState={{ checked: followed, disabled: pending, busy: pending }}');
    expect(sheet).toContain("{followed ? 'Following' : 'Follow'}");
    expect(sheet).toMatch(/trailingState:[\s\S]*?width: 78/);
    expect(sheet).toContain('AccessibilityInfo.announceForAccessibility');
  });

  it('optimistically updates one entity, rolls back only that row, and invalidates follows and feed caches', () => {
    expect(queries).toContain('onMutate: async ({ entityId, follow })');
    expect(queries).toContain('context.wasFollowed');
    expect(queries).toContain('current.filter((id) => id !== context.entityId)');
    expect(queries).toContain('queryKeys.entities.follows()');
    expect(queries).toContain('queryKeys.news.feed()');
    expect(sheet).toContain('pendingIds.has(entityId)');
  });

  it('pages through catalogue and follow rows instead of trusting the PostgREST row cap', () => {
    expect(queries).toContain('const ENTITY_PAGE_SIZE = 500');
    expect(queries.match(/\.range\(from, from \+ ENTITY_PAGE_SIZE - 1\)/g)?.length).toBe(2);
    expect(queries).toContain(".order('id', { ascending: true })");
    expect(queries).toContain(".order('entity_id', { ascending: true })");
  });

  it('restores assistive focus to the launcher after close', () => {
    expect(preview).toContain('AccessibilityInfo.setAccessibilityFocus');
    expect(full).toContain('AccessibilityInfo.setAccessibilityFocus');
    expect(actions).toContain('ref={followButtonRef}');
  });
});
