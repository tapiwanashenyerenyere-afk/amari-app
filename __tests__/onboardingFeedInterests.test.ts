import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('post-auth onboarding feed interests', () => {
  const onboarding = read('app/(onboarding)/index.tsx');
  const chip = read('components/v2/SelectionChip.tsx');
  const tuneSheet = read('components/pulse/InterestSheet.tsx');

  it('renders five announced, scroll-safe onboarding steps in the required order', () => {
    expect(onboarding).toContain('Step {step + 1} of 5');
    expect(onboarding).toContain('[0, 1, 2, 3, 4]');
    expect(onboarding).toContain('AccessibilityInfo.announceForAccessibility(`Step ${step + 1} of 5`)');
    expect(onboarding).not.toContain('accessibilityLiveRegion="polite"');
    expect(onboarding.match(/<ScrollView/g)?.length).toBeGreaterThanOrEqual(3);
    const renderedSteps = onboarding.slice(onboarding.indexOf('{step === 0'));
    expect(renderedSteps.indexOf('Question three')).toBeLessThan(renderedSteps.indexOf('<InterestScreen'));
    expect(renderedSteps.indexOf('<InterestScreen')).toBeLessThan(renderedSteps.indexOf('<GraphScreen'));
  });

  it('uses the complete member-facing taxonomy and adaptive CTA copy', () => {
    expect(onboarding).toContain('What should your briefing bring closer?');
    expect(onboarding).toContain('Choose any sectors and regions. You can tune this later.');
    expect(onboarding).toContain('FEED_TOPIC_TAGS.map');
    expect(onboarding).toContain('FEED_REGION_TAGS.map');
    expect(onboarding).not.toContain("tag: 'global'");
    expect(onboarding).toContain("selected.size === 0 ? 'Skip for now' : `Continue with ${selected.size} interests`");
  });

  it('keeps selections local and saves them before onboarding submission', () => {
    expect(onboarding).toContain('useState<Set<string>>(new Set())');
    expect(onboarding).toContain('onBack={() => setStep(2)}');
    expect(onboarding).toContain('onBack={() => setStep(3)}');
    const finalSubmit = onboarding.slice(onboarding.indexOf('const handleSubmit = async'));
    const interestSave = finalSubmit.indexOf('await setFeedInterests.mutateAsync');
    expect(interestSave).toBeGreaterThanOrEqual(0);
    expect(finalSubmit.indexOf('await submitProfile()', interestSave)).toBeGreaterThan(interestSave);
    expect(finalSubmit).not.toContain('if (feedInterests.size === 0)');
  });

  it('offers uncertainty-safe retry and continue paths', () => {
    expect(onboarding).toContain('Interests may still be saving');
    expect(onboarding).toContain('We couldn’t confirm the update.');
    expect(onboarding).toContain("text: 'Try again'");
    expect(onboarding).toContain("text: 'Continue and tune later'");
    expect(onboarding).not.toContain('Your interests could not be saved');
  });

  it('provides a reusable 44pt checked chip in dark and light variants', () => {
    expect(chip).toContain("variant?: 'light' | 'dark'");
    expect(chip).toContain('minHeight: 44');
    expect(chip).toContain('accessibilityRole="checkbox"');
    expect(chip).toContain('accessibilityState={{ checked: selected, disabled }}');
    expect(chip).toContain('<Check');
    expect(tuneSheet).toContain("import { SelectionChip }");
    expect(tuneSheet).toContain('variant="light"');
  });

  it('uses black text and progress indication on gold actions', () => {
    expect(onboarding).toContain('backgroundColor: colors.gold');
    expect(onboarding).toMatch(/primaryButtonText:[\s\S]*?color: colors\.black/);
    expect(onboarding).toContain('<ActivityIndicator color={colors.black} />');
  });

  it('announces tune-sheet failures and keeps save semantics stable while busy', () => {
    expect(tuneSheet).toContain('accessibilityLabel="Save feed interests"');
    expect(tuneSheet).toContain('accessibilityRole="button"');
    expect(tuneSheet).toContain('busy: interestsLoading || setInterests.isPending');
    expect(tuneSheet).toContain('accessibilityLiveRegion="assertive"');
    expect(tuneSheet).toContain('AccessibilityInfo.announceForAccessibility');
    expect(tuneSheet).toContain('if (!hasHydrated && interests)');
    expect(tuneSheet).toContain('disabled={!hasHydrated || setInterests.isPending}');
    expect(tuneSheet).toContain('Your saved interests didn’t load. Try again before making changes.');
  });
});
