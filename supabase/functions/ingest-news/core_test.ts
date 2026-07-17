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
  MAX_ITEMS_PER_SOURCE,
  parseFeed,
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
    (async (_url: string | URL | Request, init?: RequestInit) => ({
      ok: true,
      status: 200,
      text: () =>
        new Promise<string>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")));
        }),
    })) as typeof fetch;
  await assertRejects(
    () => fetchAndParseFeed("https://example.com/feed", stalledFetch, 5),
    DOMException,
    "aborted",
  );
});

Deno.test("ingestion wiring rotates bounded rows, bulk deduplicates, and uses the exact discovery source", async () => {
  const source = await Deno.readTextFile(
    new URL("./index.ts", import.meta.url),
  );
  assertMatch(source, /try_acquire_news_pipeline_lease/);
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
