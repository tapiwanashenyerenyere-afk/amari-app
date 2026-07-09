-- Push ledger: the briefing push runs on a daily cron but self-regulates
-- to at most one send every 3 days, and only when fresh content exists.
-- Service-only table.

begin;

create table if not exists public.push_log (
  id bigint generated always as identity primary key,
  kind text not null,
  sent_at timestamptz not null default now(),
  recipients integer not null default 0,
  meta jsonb not null default '{}'::jsonb
);

alter table public.push_log enable row level security;
-- no policies: service role only.

commit;
