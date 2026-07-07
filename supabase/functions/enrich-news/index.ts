// @ts-nocheck
// AMARI intelligence feed: article enrichment.
// Classifies pending news_articles in small batches with Claude Haiku:
// topics, regions, diaspora relevance (0-100), and a one-line summary.
// Articles at or above the relevance floor go live as 'published';
// off-thesis articles are set to 'hidden' and never shown.
//
// Invocation: scheduled via pg_cron/pg_net with the x-amari-pipeline-secret
// header, or manually by an admin member JWT. See supabase/functions/NEWS-PIPELINE.md.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PIPELINE_SECRET = Deno.env.get('NEWS_PIPELINE_SECRET') ?? '';

// ─── Model provider adapter ────────────────────────────────────────────
// One env switch moves the pipeline between providers with no code change:
//   LLM_PROVIDER=anthropic  → Claude Haiku (ANTHROPIC_API_KEY)
//   LLM_PROVIDER=openai     → any OpenAI-compatible endpoint
//     (OPENAI_API_KEY, optional OPENAI_BASE_URL for Groq/Together/Ollama,
//      optional OPENAI_MODEL, default gpt-4o-mini)
const LLM_PROVIDER = (Deno.env.get('LLM_PROVIDER') ?? 'anthropic').toLowerCase();
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const OPENAI_BASE_URL = (Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 10;
const MAX_BATCHES_PER_RUN = 4;
const RELEVANCE_FLOOR = 25;

// ─── HARD BUDGET CEILING ───────────────────────────────────────────────
// Maximum LLM spend for this pipeline: $10.00 per calendar month.
// HARD-CODED BY DESIGN — do not lift this into an env var or setting.
// When the meter in news_ai_spend reaches this ceiling, enrichment stops
// until the next calendar month. Articles simply stay pending.
const HARD_MONTHLY_BUDGET_USD = 10.0;
// Meter rates (USD per million tokens). Anthropic = Haiku 4.5 list price.
// The openai rates are deliberately conservative upper bounds so the meter
// overestimates on cheaper compat hosts and trips the ceiling early.
const METER_RATES: Record<string, { input: number; output: number }> = {
  anthropic: { input: 1.0, output: 5.0 },
  openai: { input: 0.6, output: 2.4 },
};
const ACTIVE_RATES = METER_RATES[LLM_PROVIDER] ?? METER_RATES.anthropic;
const ACTIVE_API_KEY = LLM_PROVIDER === 'openai' ? OPENAI_API_KEY : ANTHROPIC_API_KEY;

const TOPIC_TAGS = [
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
];

const REGION_TAGS = ['australia', 'uk', 'africa', 'americas', 'global'];

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function isAuthorized(req: Request): Promise<boolean> {
  const secret = req.headers.get('x-amari-pipeline-secret');
  if (PIPELINE_SECRET && secret === PIPELINE_SECRET) {
    return true;
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) {
    return false;
  }

  const memberClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await memberClient.auth.getUser(accessToken);

  if (userError || !user) {
    return false;
  }

  const { data: adminRole } = await memberClient
    .from('admin_roles')
    .select('member_id')
    .eq('member_id', user.id)
    .maybeSingle();

  return Boolean(adminRole);
}

interface Classification {
  id: number;
  topics: string[];
  regions: string[];
  relevance: number;
  summary: string;
}

function buildPrompt(articles: { id: number; title: string; snippet: string | null; source: string }[]): string {
  const list = articles
    .map(
      (a) =>
        `id: ${a.id}\nsource: ${a.source}\ntitle: ${a.title}\nsnippet: ${(a.snippet ?? '').slice(0, 280) || '(none)'}`,
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

function parseClassifications(text: string): Classification[] {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return [];

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => typeof entry?.id === 'number')
      .map((entry) => ({
        id: entry.id,
        topics: (Array.isArray(entry.topics) ? entry.topics : []).filter((t: unknown) =>
          TOPIC_TAGS.includes(String(t)),
        ),
        regions: (Array.isArray(entry.regions) ? entry.regions : []).filter((r: unknown) =>
          REGION_TAGS.includes(String(r)),
        ),
        relevance: Math.max(0, Math.min(100, Math.round(Number(entry.relevance) || 0))),
        summary: String(entry.summary ?? '').slice(0, 200),
      }));
  } catch {
    return [];
  }
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function costUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * ACTIVE_RATES.input +
    (outputTokens / 1_000_000) * ACTIVE_RATES.output
  );
}

async function getMonthSpend(serviceClient: ReturnType<typeof createClient>): Promise<number> {
  const { data } = await serviceClient
    .from('news_ai_spend')
    .select('spent_usd')
    .eq('month', currentMonth())
    .maybeSingle();
  return Number(data?.spent_usd ?? 0);
}

async function recordSpend(
  serviceClient: ReturnType<typeof createClient>,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  const month = currentMonth();
  const { data: existing } = await serviceClient
    .from('news_ai_spend')
    .select('input_tokens, output_tokens, spent_usd')
    .eq('month', month)
    .maybeSingle();

  const nextInput = Number(existing?.input_tokens ?? 0) + inputTokens;
  const nextOutput = Number(existing?.output_tokens ?? 0) + outputTokens;

  await serviceClient.from('news_ai_spend').upsert({
    month,
    input_tokens: nextInput,
    output_tokens: nextOutput,
    spent_usd: costUsd(nextInput, nextOutput).toFixed(4),
    updated_at: new Date().toISOString(),
  });
}

async function classifyBatch(
  articles: { id: number; title: string; snippet: string | null; source: string }[],
): Promise<{ classifications: Classification[]; inputTokens: number; outputTokens: number }> {
  const prompt = buildPrompt(articles);

  if (LLM_PROVIDER === 'openai') {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM API ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ?? '';

    return {
      classifications: parseClassifications(text),
      inputTokens: Number(data?.usage?.prompt_tokens ?? 0),
      outputTokens: Number(data?.usage?.completion_tokens ?? 0),
    };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = (data?.content ?? [])
    .filter((block: Record<string, unknown>) => block.type === 'text')
    .map((block: Record<string, unknown>) => block.text)
    .join('\n');

  return {
    classifications: parseClassifications(text),
    inputTokens: Number(data?.usage?.input_tokens ?? 0),
    outputTokens: Number(data?.usage?.output_tokens ?? 0),
  };
}

Deno.serve(async (req: Request) => {
  try {
    if (!(await isAuthorized(req))) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    if (!ACTIVE_API_KEY) {
      return jsonResponse(
        { error: `No API key configured for LLM provider "${LLM_PROVIDER}"` },
        500,
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // HARD BUDGET GATE: never spend past the monthly ceiling.
    let monthSpend = await getMonthSpend(serviceClient);
    if (monthSpend >= HARD_MONTHLY_BUDGET_USD) {
      return jsonResponse({
        success: true,
        enriched: 0,
        skipped: 'monthly_budget_reached',
        spent_usd: monthSpend,
        budget_usd: HARD_MONTHLY_BUDGET_USD,
        message: `Monthly AI budget of $${HARD_MONTHLY_BUDGET_USD.toFixed(2)} reached; enrichment paused until next month.`,
      });
    }

    const { data: pending, error: pendingError } = await serviceClient
      .from('news_articles')
      .select('id, title, snippet, news_sources(name)')
      .eq('status', 'pending')
      .order('ingested_at', { ascending: true })
      .limit(BATCH_SIZE * MAX_BATCHES_PER_RUN);

    if (pendingError) {
      throw pendingError;
    }

    if (!pending?.length) {
      return jsonResponse({ success: true, enriched: 0, message: 'No pending articles' });
    }

    let published = 0;
    let hidden = 0;
    let failed = 0;

    for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
      if (monthSpend >= HARD_MONTHLY_BUDGET_USD) {
        console.warn('[enrich-news] Monthly budget reached mid-run; stopping.');
        break;
      }

      const batch = pending.slice(offset, offset + BATCH_SIZE).map((row) => ({
        id: row.id,
        title: row.title,
        snippet: row.snippet,
        source: row.news_sources?.name ?? 'Unknown',
      }));

      let classifications: Classification[] = [];
      try {
        const result = await classifyBatch(batch);
        classifications = result.classifications;
        monthSpend += costUsd(result.inputTokens, result.outputTokens);
        await recordSpend(serviceClient, result.inputTokens, result.outputTokens);
      } catch (error) {
        console.error('[enrich-news] Batch classification failed:', error);
        failed += batch.length;
        continue;
      }

      const classifiedIds = new Set(classifications.map((c) => c.id));

      for (const classification of classifications) {
        const status = classification.relevance >= RELEVANCE_FLOOR ? 'published' : 'hidden';
        const { error: updateError } = await serviceClient
          .from('news_articles')
          .update({
            topics: classification.topics,
            regions: classification.regions,
            relevance: classification.relevance,
            summary: classification.summary || null,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', classification.id)
          .eq('status', 'pending');

        if (updateError) {
          console.error(`[enrich-news] Update failed for article ${classification.id}:`, updateError.message);
          failed += 1;
        } else if (status === 'published') {
          published += 1;
        } else {
          hidden += 1;
        }
      }

      // Anything the model skipped stays pending for the next run.
      const skipped = batch.filter((a) => !classifiedIds.has(a.id));
      if (skipped.length) {
        console.warn(`[enrich-news] ${skipped.length} articles skipped by classifier this run`);
      }
    }

    return jsonResponse({
      success: true,
      published,
      hidden,
      failed,
      remaining_estimate: Math.max(0, (pending.length ?? 0) - published - hidden - failed),
      spent_usd_this_month: Number(monthSpend.toFixed(4)),
      budget_usd: HARD_MONTHLY_BUDGET_USD,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[enrich-news] Error:', error);
    return jsonResponse(
      { error: 'Enrichment failed', details: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
