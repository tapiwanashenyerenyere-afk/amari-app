// @ts-nocheck -- Deno globals and jsr imports are checked by Deno itself.
import {
  assert,
  assertEquals,
  assertMatch,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert@1";
import {
  buildEntityFeedUrl,
  buildEntityQuery,
  FETCH_CONCURRENCY,
  fetchAndParseFeed,
  GOOGLE_DISCOVERY_SOURCE_FEED_URL,
  mapWithConcurrency,
  MAX_FEED_BYTES,
  MAX_ITEMS_PER_SOURCE,
  parseFeed,
  sanitizeExternalImageUrl,
  SOURCES_PER_RUN,
} from "./core.ts";

Deno.test("RSS parsing is bounded, empty feeds are valid, and malformed documents fail", () => {
  const entries = Array.from(
    { length: MAX_ITEMS_PER_SOURCE + 4 },
    (_, index) =>
      `<item><title>Story ${index}</title><link>https://example.com/${index}</link></item>`,
  ).join("");
  assertEquals(
    parseFeed(`<rss><channel>${entries}</channel></rss>`).length,
    MAX_ITEMS_PER_SOURCE,
  );
  assertEquals(parseFeed("<rss><channel></channel></rss>"), []);
  assertThrows(
    () => parseFeed("<html><body>not a feed</body></html>"),
    Error,
    "Unsupported RSS/Atom",
  );
});

Deno.test("entity search quotes the canonical name and five trimmed case-deduplicated aliases", () => {
  const query = buildEntityQuery("  Powerlist  ", [
    " Powerful Media Powerlist ",
    "powerful media powerlist",
    "Powerlist",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
  ]);
  assertEquals(
    query,
    '"Powerlist" OR "Powerful Media Powerlist" OR "One" OR "Two" OR "Three" OR "Four"',
  );
  const url = buildEntityFeedUrl("Powerlist", ["Powerful Media Powerlist"]);
  assertEquals(
    decodeURIComponent(new URL(url).searchParams.get("q") ?? ""),
    '"Powerlist" OR "Powerful Media Powerlist"',
  );
});

Deno.test("the concurrency pool never exceeds five workers and retains input ordering", async () => {
  let active = 0;
  let peak = 0;
  const values = Array.from({ length: SOURCES_PER_RUN }, (_, index) => index);
  const results = await mapWithConcurrency(
    values,
    FETCH_CONCURRENCY,
    async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      return value * 2;
    },
  );
  assertEquals(peak, FETCH_CONCURRENCY);
  assertEquals(results, values.map((value) => value * 2));
});

Deno.test("the fetch timeout remains active while the response body is read", async () => {
  const stalledFetch =
    (async (_url: string | URL | Request, init?: RequestInit) =>
      new Response(
        new ReadableStream({
          start(controller) {
            init?.signal?.addEventListener("abort", () =>
              controller.error(new DOMException("aborted", "AbortError")));
          },
        }),
        { status: 200, headers: { "content-type": "application/rss+xml" } },
      )) as typeof fetch;
  await assertRejects(
    () =>
      fetchAndParseFeed(
        "https://example.com/feed",
        stalledFetch,
        5,
        async () => ["93.184.216.34"],
      ),
    DOMException,
    "aborted",
  );
});

Deno.test("parser dependency is patched and entity expansion stays bounded", async () => {
  const source = await Deno.readTextFile(new URL("./core.ts", import.meta.url));
  assert(source.includes("fast-xml-parser@4.5.5"));
  assert(source.includes("processEntities: false"));
  const entityTitle = "&#65;".repeat(20_000);
  const [item] = parseFeed(
    `<rss><channel><item><title>${entityTitle}</title><link>https://example.com/entity</link></item></channel></rss>`,
  );
  assert(item.title.length <= 300);
});

Deno.test("future dates and unsafe image URLs are not persisted", () => {
  const [item] = parseFeed(
    `<rss><channel><item><title>Future</title><link>https://example.com/future</link><pubDate>2099-01-01T00:00:00Z</pubDate><enclosure type="image/jpeg" url="https://127.0.0.1/private.jpg" /></item></channel></rss>`,
  );
  assertEquals(item.publishedAt, null);
  assertEquals(item.imageUrl, null);
  assertEquals(sanitizeExternalImageUrl("http://example.com/image.jpg"), null);
  assertEquals(sanitizeExternalImageUrl("https://example.com/image.jpg"), "https://example.com/image.jpg");
});

Deno.test("feed redirects are revalidated and private destinations are rejected", async () => {
  const redirectingFetch = (async () =>
    new Response(null, {
      status: 302,
      headers: { location: "https://127.0.0.1/private-feed" },
    })) as typeof fetch;
  await assertRejects(
    () =>
      fetchAndParseFeed(
        "https://example.com/feed",
        redirectingFetch,
        100,
        async () => ["93.184.216.34"],
      ),
    Error,
    "non-public address",
  );
});

Deno.test("IPv4-mapped IPv6 literals cannot bypass private-address rejection", async () => {
  let called = false;
  const fetchSpy = (async () => {
    called = true;
    return new Response("", { status: 200 });
  }) as typeof fetch;
  await assertRejects(
    () =>
      fetchAndParseFeed(
        "https://[::ffff:7f00:1]/feed",
        fetchSpy,
        100,
        async () => [],
      ),
    Error,
    "non-public address",
  );
  assert(!called);
});

Deno.test("feed bodies are rejected once the byte ceiling is crossed", async () => {
  const oversizedFetch = (async () =>
    new Response(new Uint8Array(MAX_FEED_BYTES + 1), {
      status: 200,
      headers: { "content-type": "application/rss+xml" },
    })) as typeof fetch;
  await assertRejects(
    () =>
      fetchAndParseFeed(
        "https://example.com/feed",
        oversizedFetch,
        100,
        async () => ["93.184.216.34"],
      ),
    Error,
    "byte limit",
  );
});

Deno.test("ingestion wiring rotates bounded rows, bulk deduplicates, and uses the exact discovery source", async () => {
  const source = await Deno.readTextFile(
    new URL("./index.ts", import.meta.url),
  );
  assertMatch(source, /try_acquire_news_pipeline_lease/);
  assertMatch(source, /renew_news_pipeline_lease/);
  assertMatch(
    source,
    /release_news_pipeline_lease[\s\S]*p_lease_id:\s*leaseToken/,
  );
  assert(!source.includes("p_lease_token"));
  assertMatch(
    source,
    /\.order\(\s*["']last_fetched_at["'],\s*\{\s*ascending:\s*true,\s*nullsFirst:\s*true\s*\}\s*\)\.order\(\s*["']id["']/s,
  );
  assert(source.includes(".limit(SOURCES_PER_RUN)"));
  assertMatch(
    source,
    /mapWithConcurrency\(\s*selectedSources,\s*FETCH_CONCURRENCY/s,
  );
  assertMatch(
    source,
    /upsert\(rows,\s*\{\s*onConflict:\s*["']url_hash["'],\s*ignoreDuplicates:\s*true,\s*count:\s*["']exact["'],?\s*\}\)/s,
  );
  assertMatch(source, /p_entity: entity\.name/);
  assertMatch(source, /entities: \[entity\.name\]/);
  assertMatch(
    source,
    /\.eq\(["']feed_url["'], GOOGLE_DISCOVERY_SOURCE_FEED_URL\)/,
  );
  assertMatch(source, /source_id:\s*isGoogleNews\s*\?\s*discoverySourceId\s*:\s*source\.id/);
  assert(!source.includes("cleanGoogleNewsTitle(item.title)"));
  assertMatch(source, /success:\s*pipelineSuccess/);
  assertMatch(source, /pipelineSuccess\s*\?\s*200\s*:\s*502/);
  assert(!source.includes(".ilike("));
  const handlerSource = source.slice(source.indexOf("Deno.serve"));
  const leaseIndex = handlerSource.indexOf("try_acquire_news_pipeline_lease");
  const sourceSelectIndex = handlerSource.search(
    /\.from\(\s*["']news_sources["']/s,
  );
  assert(
    leaseIndex >= 0 && sourceSelectIndex >= 0 && leaseIndex < sourceSelectIndex,
  );
  assertEquals(
    GOOGLE_DISCOVERY_SOURCE_FEED_URL,
    "https://news.google.com/rss/search?q=%22African+Australian%22+(business+OR+founder+OR+entrepreneur)&hl=en-AU&gl=AU&ceid=AU:en",
  );
});
