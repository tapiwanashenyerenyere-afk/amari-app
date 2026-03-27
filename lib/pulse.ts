import type { PulseEdition } from '@/types/database';

interface PulseEditionLike extends Partial<PulseEdition> {
  publish_date: string;
  headline: string;
}

export function getPulseBlocks(content: any): string[] {
  if (!content) {
    return [];
  }

  if (typeof content === 'string') {
    return [content];
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => (typeof entry === 'string' ? entry : entry?.content))
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  }

  if (Array.isArray(content.blocks)) {
    return content.blocks
      .map((block: any) => (typeof block?.content === 'string' ? block.content : null))
      .filter((entry: string | null): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  }

  return [];
}

export function getPulseExcerpt(edition: PulseEditionLike) {
  return (
    getPulseBlocks((edition as any).summary_content)[0]
    ?? getPulseBlocks((edition as any).full_content)[0]
    ?? null
  );
}

export function getPulseArticleBody(edition: PulseEditionLike) {
  const fullBlocks = getPulseBlocks((edition as any).full_content);
  if (fullBlocks.length) {
    return fullBlocks;
  }

  return getPulseBlocks((edition as any).summary_content);
}

export function getPulseBadgeLabel(index: number) {
  return index === 0 ? 'NEW THIS WEEK' : 'FEATURED';
}

export function getPulseCategoryLabel(edition: PulseEditionLike) {
  return edition.publish_date === new Date().toISOString().slice(0, 10)
    ? 'Current Edition'
    : 'Editorial';
}

export function formatPulseDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getPulseMatchFooter(profile: {
  city?: string | null;
  industry?: string | null;
  interests?: string[] | null;
} | null | undefined) {
  const matches = [
    profile?.interests?.[0],
    profile?.industry,
    profile?.city,
  ].filter((value): value is string => Boolean(value && value.trim()));

  if (matches.length === 0) {
    return 'Matched to your AMARI profile.';
  }

  if (matches.length === 1) {
    return `Matched to ${matches[0]} in your profile.`;
  }

  return `Matched to ${matches[0]} and ${matches[1]} in your profile.`;
}
