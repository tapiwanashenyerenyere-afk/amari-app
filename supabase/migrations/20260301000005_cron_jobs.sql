-- ============================================================
-- SCHEDULED JOBS (pg_cron)
-- ============================================================

-- Weekly match generation: every Monday at 5am AEST
SELECT cron.schedule(
  'generate-aligned-matches',
  '0 19 * * 0',
  $$SELECT generate_weekly_matches()$$
);

-- Daily barcode seed: every day at midnight AEST
SELECT cron.schedule(
  'generate-daily-seed',
  '0 14 * * *',
  $$SELECT ensure_daily_seed()$$
);

-- Rate limit cleanup: every 15 minutes
SELECT cron.schedule(
  'cleanup-rate-limits',
  '*/15 * * * *',
  $$SELECT cleanup_rate_limits()$$
);

-- Expire old aligned matches: daily
SELECT cron.schedule(
  'expire-aligned-matches',
  '0 0 * * *',
  $$UPDATE aligned_matches SET stage = 'expired' WHERE stage IN ('new', 'accepted') AND expires_at < now()$$
);
