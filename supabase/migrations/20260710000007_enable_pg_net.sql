-- Enable pg_net so triggers and cron jobs can call edge functions via
-- net.http_post. This was missing on the project — every cron
-- (news ingest/enrich, briefing push, engagement digest) and every
-- notify trigger depends on it. Idempotent.

create extension if not exists pg_net;
