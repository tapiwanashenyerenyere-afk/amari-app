// @ts-nocheck -- Deno remote imports are checked by the Deno Quality Gate.
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.0";

export const MAX_ITEMS_PER_SOURCE = 25;
export const SOURCES_PER_RUN = 15;
export const ENTITIES_PER_RUN = 10;
export const ENTITY_ITEMS_PER_ENTITY = 5;
export const FETCH_CONCURRENCY = 5;
export const FETCH_TIMEOUT_MS = 15_000;
export const USER_AGENT = "AMARI-App-Feed/1.0 (+https://www.amarigroupau.com)";
export const GOOGLE_DISCOVERY_SOURCE_FEED_URL =
  "https://news.google.com/rss/search?q=%22African+Australian%22+(business+OR+founder+OR+entrepreneur)&hl=en-AU&gl=AU&ceid=AU:en";

export interface FeedItem {
  title: string;
  url: string;
  snippet: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/&#8216;|&lsquo;/gi, "'")
    .replace(/&#8220;|&ldquo;/gi, '"')
    .replace(/&#8221;|&rdquo;/gi, '"')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (typeof record["#text"] === "string") return record["#text"];
    if (typeof record["#text"] === "number") return String(record["#text"]);
    if (typeof record["@_href"] === "string") return record["@_href"];
  }
  return "";
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function extractImage(item: Record<string, unknown>): string | null {
  const enclosures = asArray(item.enclosure as Record<string, unknown>[]);
  for (const enclosure of enclosures) {
    const type = String(enclosure?.["@_type"] ?? "");
    const url = String(enclosure?.["@_url"] ?? "");
    if (
      url &&
      (type.startsWith("image/") || /\.(jpe?g|png|webp)(\?|$)/i.test(url))
    ) {
      return url;
    }
  }

  const media = asArray(item["media:content"] as Record<string, unknown>[])
    .concat(
      asArray(item["media:thumbnail"] as Record<string, unknown>[]),
    );
  for (const entry of media) {
    const url = String(entry?.["@_url"] ?? "");
    if (url) return url;
  }

  return null;
}

export function parseFeed(
  xml: string,
  maxItems = MAX_ITEMS_PER_SOURCE,
): FeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const doc = parser.parse(xml);
  const hasRssChannel = Object.prototype.hasOwnProperty.call(
    doc?.rss ?? {},
    "channel",
  );
  const hasAtomFeed = Object.prototype.hasOwnProperty.call(doc ?? {}, "feed");
  if (!hasRssChannel && !hasAtomFeed) {
    throw new Error("Unsupported RSS/Atom document");
  }

  const rssItems = asArray<Record<string, unknown>>(doc?.rss?.channel?.item);
  const atomEntries = asArray<Record<string, unknown>>(doc?.feed?.entry);
  const items: FeedItem[] = [];

  for (const item of rssItems) {
    const title = stripHtml(textOf(item.title));
    const url = textOf(item.link).trim();
    if (!title || !url.startsWith("http")) continue;

    const description = stripHtml(
      textOf(item.description ?? item["content:encoded"] ?? ""),
    );
    const pubDate = textOf(item.pubDate ?? item["dc:date"] ?? "");
    const parsedDate = pubDate ? new Date(pubDate) : null;

    items.push({
      title: truncate(title, 300),
      url,
      snippet: description ? truncate(description, 320) : null,
      imageUrl: extractImage(item),
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : null,
    });
  }

  for (const entry of atomEntries) {
    const title = stripHtml(textOf(entry.title));
    const links = asArray(entry.link as Record<string, unknown>[]);
    const alternate = links.find((link) =>
      (link?.["@_rel"] ?? "alternate") === "alternate"
    );
    const url = String(alternate?.["@_href"] ?? links[0]?.["@_href"] ?? "")
      .trim();
    if (!title || !url.startsWith("http")) continue;

    const summary = stripHtml(textOf(entry.summary ?? entry.content ?? ""));
    const published = textOf(entry.published ?? entry.updated ?? "");
    const parsedDate = published ? new Date(published) : null;

    items.push({
      title: truncate(title, 300),
      url,
      snippet: summary ? truncate(summary, 320) : null,
      imageUrl: null,
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : null,
    });
  }

  return items.slice(0, Math.max(0, maxItems));
}

export function cleanGoogleNewsTitle(title: string): string {
  const separatorIndex = title.lastIndexOf(" - ");
  return separatorIndex > 20 ? title.slice(0, separatorIndex).trim() : title;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function quoteSearchTerm(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function buildEntityQuery(
  name: string,
  aliases: string[] | null | undefined,
): string {
  const canonical = name.trim();
  if (!canonical) throw new Error("Entity name is required");

  const seen = new Set([canonical.toLocaleLowerCase("en")]);
  const uniqueAliases: string[] = [];
  for (const rawAlias of aliases ?? []) {
    const alias = rawAlias.trim();
    const folded = alias.toLocaleLowerCase("en");
    if (!alias || seen.has(folded)) continue;
    seen.add(folded);
    uniqueAliases.push(alias);
    if (uniqueAliases.length === 5) break;
  }

  return [canonical, ...uniqueAliases].map(quoteSearchTerm).join(" OR ");
}

export function buildEntityFeedUrl(
  name: string,
  aliases: string[] | null | undefined,
): string {
  return `https://news.google.com/rss/search?q=${
    encodeURIComponent(buildEntityQuery(name, aliases))
  }&hl=en-AU&gl=AU&ceid=AU:en`;
}

export async function fetchAndParseFeed(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Keep the timeout alive until both the response body and XML parsing finish.
    const xml = await response.text();
    return parseFeed(xml);
  } finally {
    clearTimeout(timeout);
  }
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = Math.max(1, Math.floor(concurrency));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runWorker()),
  );
  return results;
}
