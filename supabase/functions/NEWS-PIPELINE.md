# Intelligence feed pipeline

Two edge functions keep the in-app news feed supplied:

- `ingest-news` pulls the active RSS feeds in `news_sources` and inserts new rows into `news_articles` as `pending`. Only feed-provided data is stored (headline, snippet, link, image reference) — full article text is never fetched.
- `enrich-news` classifies pending articles with Claude Haiku (topics, regions, diaspora relevance 0-100, one-line summary) and flips them to `published` (relevance ≥ 25) or `hidden`.

The migration `20260707000001_intelligence_feed.sql` creates the tables, RLS, member RPCs (`get_news_feed`, `set_feed_interests`, `record_news_events`, `toggle_saved_article`, `get_saved_articles`), the service-only `fold_feed_affinities()` job, and seeds the verified source list.

## Deploy

```bash
supabase functions deploy ingest-news --no-verify-jwt
supabase functions deploy enrich-news --no-verify-jwt
```

`--no-verify-jwt` is required because the cron caller authenticates with the pipeline secret header, not a user JWT. Both functions independently enforce authorization: either the `x-amari-pipeline-secret` header or an admin member JWT. All other callers get 401.

## Secrets

```bash
supabase secrets set NEWS_PIPELINE_SECRET=<long random string>
supabase secrets set ANTHROPIC_API_KEY=<key>
```

### Switching model provider

Enrichment is provider-agnostic. Default is Anthropic (Claude Haiku). To run on
any OpenAI-compatible endpoint instead (OpenAI, Groq, Together, a local Ollama):

```bash
supabase secrets set LLM_PROVIDER=openai OPENAI_API_KEY=<key>
# optional overrides:
supabase secrets set OPENAI_BASE_URL=https://api.groq.com/openai/v1 OPENAI_MODEL=llama-3.3-70b-versatile
```

The $10.00/month hard ceiling applies to whichever provider is active; the
meter uses conservative upper-bound rates for openai-compatible hosts so it
trips early rather than late.

Generate the pipeline secret with `openssl rand -hex 32`. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Schedule (run once in the SQL editor)

pg_cron and pg_net are available on all Supabase plans. Store the secret in Vault first so it is not embedded in the cron command:

```sql
select vault.create_secret('<same value as NEWS_PIPELINE_SECRET>', 'news_pipeline_secret');

select cron.schedule(
  'ingest-news-hourly',
  '5,50 * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/ingest-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-amari-pipeline-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'news_pipeline_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

select cron.schedule(
  'enrich-news-half-hourly',
  '15,45 * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/enrich-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-amari-pipeline-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'news_pipeline_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

select cron.schedule(
  'fold-feed-affinities-nightly',
  '30 16 * * *',  -- 02:30 AEST
  $$ select public.fold_feed_affinities(); $$
);
```

Cron offsets are staggered so ingestion lands before each enrichment pass.

## Operations

- Source health lives on `news_sources` (`last_status`, `fail_count`). A failing feed does not stop the run; disable a source by setting `active = false`.
- Removal requests from a publisher: set the source `active = false` and delete its articles. This should happen same-day.
- pg_cron does not retry skipped runs and has no built-in alerting. Staleness check: if `max(news_articles.ingested_at)` is more than three hours old during waking hours, inspect the cron run history in `cron.job_run_details` and the function logs.
- Cost: classification runs on Claude Haiku in batches of ten; at the seeded source volume this is a few dollars a month.
- Both functions can be triggered manually by an admin from the app session (Authorization bearer token) for testing.
