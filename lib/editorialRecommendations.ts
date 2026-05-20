import { EDITORIAL_STORIES } from '@/data/editorialStories';
import type { EditorialRecommendation, EditorialStory } from '@/types/editorial';

interface EditorialProfile {
  skills?: string[] | null;
  interests?: string[] | null;
  current_project?: string | null;
  industry?: string | null;
  city?: string | null;
  tier?: string | null;
}

function tokenize(values: Array<string | null | undefined>): string[] {
  return values
    .flatMap((value) => (value ?? '').toLowerCase().split(/[^a-z0-9]+/))
    .filter(Boolean);
}

function buildProfileSignals(profile: EditorialProfile | null | undefined) {
  return new Set(
    tokenize([
      ...(Array.isArray(profile?.skills) ? profile.skills : []),
      ...(Array.isArray(profile?.interests) ? profile.interests : []),
      profile?.current_project,
      profile?.industry,
      profile?.city,
    ]),
  );
}

function getStorySignalSet(story: EditorialStory) {
  return new Set(
    tokenize([
      story.category,
      story.shortLabel,
      story.headline,
      story.summary,
      story.amariConnection,
      ...story.signals,
      ...story.body,
    ]),
  );
}

function getMatchedSignals(profileSignals: Set<string>, story: EditorialStory) {
  const storySignals = getStorySignalSet(story);
  return [...profileSignals].filter((signal) => storySignals.has(signal));
}

function freshnessBoost(story: EditorialStory) {
  const ageInDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(story.publishedAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (ageInDays <= 30) return 0.28;
  if (ageInDays <= 90) return 0.18;
  if (ageInDays <= 180) return 0.1;
  return 0.04;
}

function buildReason(story: EditorialStory, matchedSignals: string[]) {
  if (matchedSignals.length > 0) {
    return `Matched to ${matchedSignals.slice(0, 2).join(' and ')} in your profile`;
  }

  if (story.amariConnection) {
    return `AMARI connection: ${story.amariConnection}`;
  }

  return 'Selected for the current Pulse cycle';
}

export function rankEditorialStories(
  profile: EditorialProfile | null | undefined,
  stories: EditorialStory[] = EDITORIAL_STORIES,
) {
  const profileSignals = buildProfileSignals(profile);

  const ranked = stories.map((story) => {
    const matchedSignals = getMatchedSignals(profileSignals, story);
    const signalScore = matchedSignals.length * 0.35;
    const featureBoost = story.featured ? 0.16 : 0.08;
    const amariBoost = story.amariConnection ? 0.08 : 0;
    const imageBoost = story.image ? 0.04 : 0;
    const score = signalScore + featureBoost + amariBoost + imageBoost + freshnessBoost(story);

    return {
      story,
      score,
      matchedSignals,
      reason: buildReason(story, matchedSignals),
    } satisfies EditorialRecommendation;
  });

  return ranked.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return new Date(b.story.publishedAt).getTime() - new Date(a.story.publishedAt).getTime();
  });
}

export function getRecommendedEditorialLead(
  profile: EditorialProfile | null | undefined,
  stories: EditorialStory[] = EDITORIAL_STORIES,
) {
  return rankEditorialStories(profile, stories)[0] ?? null;
}
