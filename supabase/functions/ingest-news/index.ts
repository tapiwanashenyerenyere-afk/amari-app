// @ts-nocheck
// AMARI intelligence feed: RSS ingestion.
// Pulls active feeds from news_sources, normalises items, and inserts new
// rows into news_articles as status 'pending' for the enrichment pass.
//
// Content posture: only what the feed itself provides is stored (title,
// summary snippet, link, image reference). Full article text is never
// fetched or stored.
//
// Invocation: scheduled via pg_cron/pg_net with the x-amari-pipeline-secret
// header, or manually by an admin member JWT. See supabase/functions/NEWS-PIPELINE.md.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.5.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PIPELINE_SECRET = Deno.env.get('NEWS_PIPELINE_SECRET') ?? '';

const MAX_ITEMS_PER_SOURCE = 25;
const FETCH_TIMEOUT_MS = 15000;
const USER_AGENT = 'AMARI-App-Feed/1.0 (+https://www.amarigroupau.com)';

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

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/&#8216;|&lsquo;/gi, "'")
    .replace(/&#8220;|&ldquo;/gi, '"')
    .replace(/&#8221;|&rdquo;/gi, '"')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function textOf(node: unknown): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    if (typeof record['#text'] === 'string') return record['#text'];
    if (typeof record['#text'] === 'number') return String(record['#text']);
    if (typeof record['@_href'] === 'string') return record['@_href'];
  }
  return '';
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

interface FeedItem {
  title: string;
  url: string;
  snippet: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
}

function extractImage(item: Record<string, unknown>): string | null {
  const enclosures = asArray(item.enclosure as Record<string, unknown>[]);
  for (const enclosure of enclosures) {
    const type = String(enclosure?.['@_type'] ?? '');
    const url = String(enclosure?.['@_url'] ?? '');
    if (url && (type.startsWith('image/') || /\.(jpe?g|png|webp)(\?|$)/i.test(url))) {
      return url;
    }
  }

  const media = asArray(item['media:content'] as Record<string, unknown>[]).concat(
    asArray(item['media:thumbnail'] as Record<string, unknown>[]),
  );
  for (const entry of media) {
    const url = String(entry?.['@_url'] ?? '');
    if (url) return url;
  }

  return null;
}

function parseFeed(xml: string): FeedItem[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);

  const rssItems = asArray(doc?.rss?.channel?.item);
  const atomEntries = asArray(doc?.feed?.entry);
  const items: FeedItem[] = [];

  for (const item of rssItems) {
    const title = stripHtml(textOf(item.title));
    const url = textOf(item.link).trim();
    if (!title || !url.startsWith('http')) continue;

    const description = stripHtml(textOf(item.description ?? item['content:encoded'] ?? ''));
    const pubDate = textOf(item.pubDate ?? item['dc:date'] ?? '');
    const parsedDate = pubDate ? new Date(pubDate) : null;

    items.push({
      title: truncate(title, 300),
      url,
      snippet: description ? truncate(description, 320) : null,
      imageUrl: extractImage(item),
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
    });
  }

  for (const entry of atomEntries) {
    const title = stripHtml(textOf(entry.title));
    const links = asArray(entry.link as Record<string, unknown>[]);
    const alternate = links.find((l) => (l?.['@_rel'] ?? 'alternate') === 'alternate');
    const url = String(alternate?.['@_href'] ?? links[0]?.['@_href'] ?? '').trim();
    if (!title || !url.startsWith('http')) continue;

    const summary = stripHtml(textOf(entry.summary ?? entry.content ?? ''));
    const published = textOf(entry.published ?? entry.updated ?? '');
    const parsedDate = published ? new Date(published) : null;

    items.push({
      title: truncate(title, 300),
      url,
      snippet: summary ? truncate(summary, 320) : null,
      imageUrl: null,
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
    });
  }

  return items.slice(0, MAX_ITEMS_PER_SOURCE);
}

function cleanGoogleNewsTitle(title: string): string {
  const separatorIndex = title.lastIndexOf(' - ');
  if (separatorIndex > 20) {
    return title.slice(0, separatorIndex).trim();
  }
  return title;
}

Deno.serve(async (req: Request) => {
  try {
    if (!(await isAuthorized(req))) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: sources, error: sourcesError } = await serviceClient
      .from('news_sources')
      .select('id, name, feed_url, region, fail_count')
      .eq('active', true);

    if (sourcesError) {
      throw sourcesError;
    }

    const results: Record<string, unknown>[] = [];
    let totalInserted = 0;

    for (const source of sources ?? []) {
      const isGoogleNews = source.feed_url.includes('news.google.com');
      let inserted = 0;
      let status = 'ok';

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const response = await fetch(source.feed_url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const xml = await response.text();
        const items = parseFeed(xml);

        for (const item of items) {
          const title = isGoogleNews ? cleanGoogleNewsTitle(item.title) : item.title;
          const urlHash = await sha256Hex(item.url);

          const { error: insertError, count } = await serviceClient
            .from('news_articles')
            .insert(
              {
                source_id: source.id,
                url: item.url,
                url_hash: urlHash,
                title,
                snippet: item.snippet,
                image_url: item.imageUrl,
                published_at: item.publishedAt,
              },
              { count: 'exact' },
            );

          if (!insertError) {
            inserted += count ?? 1;
          } else if (insertError.code !== '23505') {
            // 23505 = duplicate url_hash, expected on every run.
            console.error(`[ingest-news] insert failed for ${source.name}:`, insertError.message);
          }
        }

        await serviceClient
          .from('news_sources')
          .update({
            last_fetched_at: new Date().toISOString(),
            last_status: `ok: ${items.length} items, ${inserted} new`,
            fail_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.id);
      } catch (error) {
        status = error instanceof Error ? error.message : String(error);
        await serviceClient
          .from('news_sources')
          .update({
            last_fetched_at: new Date().toISOString(),
            last_status: `error: ${status}`,
            fail_count: (source.fail_count ?? 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.id);
      }

      totalInserted += inserted;
      results.push({ source: source.name, status, inserted });
    }

    return jsonResponse({
      success: true,
      sources: results.length,
      inserted: totalInserted,
      details: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ingest-news] Error:', error);
    return jsonResponse(
      { error: 'Ingestion failed', details: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
