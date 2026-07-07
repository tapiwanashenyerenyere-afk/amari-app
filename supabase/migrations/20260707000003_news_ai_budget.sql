-- Hard monthly budget ledger for the news enrichment pipeline.
-- The $10.00/month ceiling itself is hard-coded in the enrich-news edge
-- function; this table is the durable meter it checks against.

begin;

create table if not exists public.news_ai_spend (
  month text primary key check (month ~ '^\d{4}-\d{2}$'),
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  spent_usd numeric(8,4) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.news_ai_spend enable row level security;
-- Service-role only: no policies. The pipeline reads and writes with the
-- service key; clients have no access.

commit;
