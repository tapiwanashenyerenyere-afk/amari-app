-- Repair the two degraded legacy feeds flagged during the 1.2.5 release.
--
-- Forward-only, data-only: touches only two existing news_sources rows, adds
-- no schema. It does NOT weaken the redirect / content-type / SSRF boundary
-- introduced in 20260717000002 — both feeds are brought into compliance with
-- that boundary instead.
--
-- Lionesses of Africa: the seeded apex URL 302-redirects to the `www` host, and
-- the redirect boundary (correctly) rejects a cross-host redirect. The `www`
-- host serves the identical Squarespace RSS feed directly with no redirect, so
-- point the source at the canonical host. Reset the failure counters so it
-- re-enters rotation cleanly.
--
-- The Voice: the WordPress feed was removed upstream; /feed/ and /rss now both
-- redirect to the HTML homepage (content-type text/html), so there is no valid
-- feed to point at. Deactivate the source. Ingestion already skips inactive
-- sources; this simply stops the source from reporting a failure every run.

update public.news_sources
set feed_url = 'https://www.lionessesofafrica.com/blog?format=rss',
    active = true,
    fail_count = 0,
    last_status = null,
    updated_at = now()
where name = 'Lionesses of Africa'
  and feed_url = 'https://lionessesofafrica.com/blog?format=rss';

update public.news_sources
set active = false,
    updated_at = now()
where name = 'The Voice'
  and feed_url = 'https://www.voice-online.co.uk/feed/';
