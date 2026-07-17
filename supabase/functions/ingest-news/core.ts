// @ts-nocheck -- Deno remote imports are checked by the Deno Quality Gate.
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.5";

export const MAX_ITEMS_PER_SOURCE = 25;
export const SOURCES_PER_RUN = 15;
export const ENTITIES_PER_RUN = 10;
export const ENTITY_ITEMS_PER_ENTITY = 5;
export const FETCH_CONCURRENCY = 5;
export const FETCH_TIMEOUT_MS = 15_000;
export const MAX_FEED_BYTES = 1_000_000;
export const MAX_FEED_REDIRECTS = 3;
export const MAX_FUTURE_PUBLISH_SKEW_MS = 15 * 60 * 1_000;
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

type ResolveDns = (
  query: string,
  recordType: "A" | "AAAA",
) => Promise<string[]>;

function isPublicIpAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const mappedV4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  const mappedHex = normalized.match(/^(?:(?:0:){5}|::)ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  const mappedHexV4 = mappedHex
    ? [
      Number.parseInt(mappedHex[1], 16) >> 8,
      Number.parseInt(mappedHex[1], 16) & 255,
      Number.parseInt(mappedHex[2], 16) >> 8,
      Number.parseInt(mappedHex[2], 16) & 255,
    ].join(".")
    : null;
  const ipv4 = mappedV4 ?? mappedHexV4 ??
    (/^\d+\.\d+\.\d+\.\d+$/.test(normalized) ? normalized : null);

  if (ipv4) {
    const octets = ipv4.split(".").map(Number);
    if (
      octets.length !== 4 ||
      octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
    ) return false;

    const [a, b, c] = octets;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  if (!normalized.includes(":")) return false;
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
}

async function assertSafeFeedUrl(url: string, resolveDns: ResolveDns): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid feed URL");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    (parsed.port && parsed.port !== "443")
  ) throw new Error("Feed URL must use HTTPS without credentials or a custom port");

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) throw new Error("Feed URL resolves to a non-public host");

  if (/^[\d.]+$/.test(hostname) || hostname.includes(":")) {
    if (!isPublicIpAddress(hostname)) {
      throw new Error("Feed URL resolves to a non-public address");
    }
    return parsed;
  }

  const resolutions = await Promise.allSettled([
    resolveDns(hostname, "A"),
    resolveDns(hostname, "AAAA"),
  ]);
  const addresses = resolutions.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  if (!addresses.length || addresses.some((address) => !isPublicIpAddress(address))) {
    throw new Error("Feed URL resolves to a non-public address");
  }
  return parsed;
}

async function readBoundedText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FEED_BYTES) {
    throw new Error(`Feed exceeds ${MAX_FEED_BYTES} byte limit`);
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_FEED_BYTES) {
      await reader.cancel("feed body too large");
      throw new Error(`Feed exceeds ${MAX_FEED_BYTES} byte limit`);
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
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
      return sanitizeExternalImageUrl(url);
    }
  }

  const media = asArray(item["media:content"] as Record<string, unknown>[])
    .concat(
      asArray(item["media:thumbnail"] as Record<string, unknown>[]),
    );
  for (const entry of media) {
    const url = String(entry?.["@_url"] ?? "");
    if (url) return sanitizeExternalImageUrl(url);
  }

  return null;
}

export function sanitizeExternalImageUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" || parsed.username || parsed.password ||
      (parsed.port && parsed.port !== "443")
    ) return null;
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      hostname === "localhost" || hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") || hostname.endsWith(".internal") ||
      ((/^[\d.]+$/.test(hostname) || hostname.includes(":")) &&
        !isPublicIpAddress(hostname))
    ) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizePublishedAt(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  if (date.getTime() > Date.now() + MAX_FUTURE_PUBLISH_SKEW_MS) return null;
  return date.toISOString();
}

export function parseFeed(
  xml: string,
  maxItems = MAX_ITEMS_PER_SOURCE,
): FeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    processEntities: false,
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
      publishedAt: normalizePublishedAt(parsedDate),
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
      publishedAt: normalizePublishedAt(parsedDate),
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
  resolveDns: ResolveDns = Deno.resolveDns,
): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let currentUrl = await assertSafeFeedUrl(url, resolveDns);
    const originalHostname = currentUrl.hostname;
    for (let redirects = 0; redirects <= MAX_FEED_REDIRECTS; redirects += 1) {
      const response = await fetchImpl(currentUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location || redirects === MAX_FEED_REDIRECTS) {
          throw new Error("Feed redirect limit exceeded");
        }
        currentUrl = await assertSafeFeedUrl(
          new URL(location, currentUrl).toString(),
          resolveDns,
        );
        if (currentUrl.hostname !== originalHostname) {
          throw new Error("Feed redirects cannot change host");
        }
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (
        contentType &&
        !contentType.includes("xml") &&
        !contentType.includes("text/plain") &&
        !contentType.includes("application/octet-stream")
      ) throw new Error(`Unsupported feed content type: ${contentType}`);

      // Keep the timeout alive until both the bounded body read and XML parse finish.
      return parseFeed(await readBoundedText(response));
    }
    throw new Error("Feed redirect limit exceeded");
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
