export const HARD_MONTHLY_BUDGET_USD = 10;
export const MAX_OUTPUT_TOKENS = 2_000;

export const TOPIC_TAGS = [
  'entrepreneurship',
  'creative-industries',
  'technology',
  'capital',
  'leadership',
  'food-agribusiness',
  'property-infrastructure',
  'careers-talent',
  'policy',
  'culture',
] as const;

export const REGION_TAGS = [
  'australia',
  'uk',
  'africa',
  'americas',
  'global',
] as const;

export interface MeterRates {
  input: number;
  output: number;
}

export interface PromptArticle {
  id: number;
  title: string;
  snippet: string | null;
  source: string;
}

export interface Classification {
  id: number;
  topics: string[];
  regions: string[];
  relevance: number;
  summary: string;
}

export interface PacingAllowance {
  month: string;
  elapsedFraction: number;
  allowedUsd: number;
}

export function currentUtcMonth(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function pacingAllowance(
  date = new Date(),
  monthlyBudgetUsd = HARD_MONTHLY_BUDGET_USD,
): PacingAllowance {
  const startMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  const endMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
  const elapsedFraction = Math.min(
    1,
    Math.max(0, (date.getTime() - startMs) / (endMs - startMs)),
  );

  return {
    month: currentUtcMonth(date),
    elapsedFraction,
    allowedUsd: Math.min(monthlyBudgetUsd, monthlyBudgetUsd * elapsedFraction),
  };
}

export function costUsd(
  inputTokens: number,
  outputTokens: number,
  rates: MeterRates,
): number {
  return (
    (inputTokens / 1_000_000) * rates.input +
    (outputTokens / 1_000_000) * rates.output
  );
}

export function promptReservationUsd(
  prompt: string,
  rates: MeterRates,
  maxOutputTokens = MAX_OUTPUT_TOKENS,
): number {
  const inputBytes = new TextEncoder().encode(prompt).byteLength;
  return costUsd(inputBytes, maxOutputTokens, rates);
}

export function buildPrompt(articles: PromptArticle[]): string {
  const list = articles
    .map(
      (article) =>
        `id: ${article.id}\nsource: ${article.source}\ntitle: ${article.title}\nsnippet: ${(article.snippet ?? '').slice(0, 280) || '(none)'}`,
    )
    .join('\n---\n');

  return `You classify news articles for a members app serving the African diaspora community in Australia, with secondary audiences in the UK, across Africa, and in the Americas. The feed covers entrepreneurship, creative industries, business, capital, and industry leadership by and for people of African heritage.

For each article below, return:
- topics: 1-3 tags from exactly this list: ${TOPIC_TAGS.join(', ')}
- regions: 1-2 tags from exactly this list: ${REGION_TAGS.join(', ')}
- relevance: 0-100. How relevant is this to African diaspora business, entrepreneurship, creative industry, or leadership? African-Australian stories score highest. General business news with no African or diaspora connection scores under 20. Celebrity gossip, sport results, and crime stories score under 10 regardless of who is involved.
- summary: one neutral sentence, 160 characters maximum, Australian English, no exclamation marks.

Articles:
${list}

Respond with ONLY a valid JSON array, no code fences, one object per article:
[{"id": 123, "topics": ["entrepreneurship"], "regions": ["africa"], "relevance": 72, "summary": "..."}]`;
}

export function parseClassifications(text: string): Classification[] {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return [];

  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as Record<string, unknown>).id === 'number',
      )
      .map((entry) => ({
        id: entry.id as number,
        topics: (Array.isArray(entry.topics) ? entry.topics : [])
          .map(String)
          .filter((tag) => (TOPIC_TAGS as readonly string[]).includes(tag)),
        regions: (Array.isArray(entry.regions) ? entry.regions : [])
          .map(String)
          .filter((tag) => (REGION_TAGS as readonly string[]).includes(tag)),
        relevance: Math.max(
          0,
          Math.min(100, Math.round(Number(entry.relevance) || 0)),
        ),
        summary: String(entry.summary ?? '').slice(0, 200),
      }));
  } catch {
    return [];
  }
}
