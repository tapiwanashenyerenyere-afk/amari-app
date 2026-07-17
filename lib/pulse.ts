import type { PulseEdition } from '@/types/database';

interface PulseEditionLike extends Partial<PulseEdition> {
  publish_date: string;
  headline: string;
}

export function normalizePulseText(value: string) {
  return value
    .replace(/The 2026 Laureate Class Revealed/gi, 'Meet the AMARI Gala 2026 nominees')
    .replace(/2026 Laureate Class/gi, 'AMARI Gala 2026 nominees')
    .replace(/Laureate Class/g, 'AMARI Gala nominees')
    .replace(/laureate class/g, 'nominees');
}

function getPulseContentLabel(content: any): string | null {
  if (content && typeof content.category_label === 'string' && content.category_label.trim()) {
    return normalizePulseText(content.category_label.trim());
  }

  return null;
}

export function getPulseBlocks(content: any): string[] {
  if (!content) {
    return [];
  }

  if (typeof content === 'string') {
    return [normalizePulseText(content)];
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => (typeof entry === 'string' ? entry : entry?.content))
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map(normalizePulseText);
  }

  if (Array.isArray(content.blocks)) {
    return content.blocks
      .map((block: any) => (typeof block?.content === 'string' ? block.content : null))
      .filter((entry: string | null): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map(normalizePulseText);
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
  const label =
    getPulseContentLabel((edition as any).summary_content)
    ?? getPulseContentLabel((edition as any).full_content);

  if (label) {
    return label;
  }

  return edition.publish_date === new Date().toISOString().slice(0, 10)
    ? 'Current Edition'
    : 'Editorial';
}

export function getPulseNominees(edition: PulseEditionLike) {
  const content = (edition as any).full_content;

  if (Array.isArray(content?.nominees)) {
    return content.nominees;
  }

  if (Array.isArray(content?.blocks)) {
    const nomineeBlock = content.blocks.find((block: any) => Array.isArray(block?.nominees));
    if (nomineeBlock) {
      return nomineeBlock.nominees;
    }
  }

  return [];
}

export function formatPulseDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
