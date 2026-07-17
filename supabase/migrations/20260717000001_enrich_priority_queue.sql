-- Reputation-prioritised enrichment queue with concurrency-safe pipeline
-- leases and atomic AI budget reservations.

begin;

alter table public.news_ai_spend
  alter column spent_usd type numeric(14,8)
  using spent_usd::numeric(14,8);

alter table public.news_ai_spend
  add column if not exists reserved_usd numeric(14,8) not null default 0;

alter table public.news_ai_spend
  drop constraint if exists news_ai_spend_reserved_nonnegative;
alter table public.news_ai_spend
  add constraint news_ai_spend_reserved_nonnegative
  check (reserved_usd >= 0);

create table if not exists public.news_pipeline_leases (
  pipeline text primary key check (pipeline in ('enrich-news', 'ingest-news')),
  lease_id uuid not null,
  acquired_at timestamptz not null,
  leased_until timestamptz not null,
  check (leased_until > acquired_at)
);

create table if not exists public.news_ai_budget_reservations (
  id uuid primary key,
  month text not null references public.news_ai_spend(month),
  reserved_usd numeric(14,8) not null check (reserved_usd > 0),
  status text not null default 'active'
    check (status in ('active', 'settled', 'released')),
  input_tokens bigint,
  output_tokens bigint,
  actual_usd numeric(14,8),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  released_at timestamptz,
  check (input_tokens is null or input_tokens >= 0),
  check (output_tokens is null or output_tokens >= 0),
  check (actual_usd is null or actual_usd >= 0)
);

create index if not exists news_ai_budget_reservations_active_idx
  on public.news_ai_budget_reservations (month, created_at)
  where status = 'active';

alter table public.news_pipeline_leases enable row level security;
alter table public.news_ai_budget_reservations enable row level security;

revoke all on table public.news_pipeline_leases
  from public, anon, authenticated;
revoke all on table public.news_ai_budget_reservations
  from public, anon, authenticated;
grant all on table public.news_pipeline_leases to service_role;
grant all on table public.news_ai_budget_reservations to service_role;

create index if not exists news_articles_pending_effective_idx
  on public.news_articles (
    (coalesce(published_at, ingested_at)) desc,
    id desc
  )
  where status = 'pending';

create or replace function public.get_pending_for_enrichment(p_limit integer)
returns table (
  id bigint,
  title text,
  snippet text,
  source_name text
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    a.id,
    a.title,
    a.snippet,
    s.name as source_name
  from public.news_articles as a
  join public.news_sources as s on s.id = a.source_id
  where a.status = 'pending'
    and coalesce(a.published_at, a.ingested_at) > now() - interval '14 days'
  order by
    s.default_weight desc,
    coalesce(a.published_at, a.ingested_at) desc,
    a.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
$fn$;

create or replace function public.try_acquire_news_pipeline_lease(
  p_pipeline text,
  p_lease_seconds integer default 180
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_now timestamptz := clock_timestamp();
  v_lease_id uuid := extensions.gen_random_uuid();
  v_acquired uuid;
  v_seconds integer := least(greatest(coalesce(p_lease_seconds, 180), 30), 900);
begin
  if p_pipeline not in ('enrich-news', 'ingest-news') then
    return null;
  end if;

  insert into public.news_pipeline_leases (
    pipeline,
    lease_id,
    acquired_at,
    leased_until
  )
  values (
    p_pipeline,
    v_lease_id,
    v_now,
    v_now + make_interval(secs => v_seconds)
  )
  on conflict (pipeline) do update
  set lease_id = excluded.lease_id,
      acquired_at = excluded.acquired_at,
      leased_until = excluded.leased_until
  where public.news_pipeline_leases.leased_until <= v_now
  returning lease_id into v_acquired;

  return v_acquired;
end;
$fn$;

create or replace function public.release_news_pipeline_lease(
  p_pipeline text,
  p_lease_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_rows integer;
begin
  delete from public.news_pipeline_leases
  where pipeline = p_pipeline
    and lease_id = p_lease_id;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$fn$;

create or replace function public.reserve_news_ai_budget(
  p_month text,
  p_requested_usd numeric,
  p_allowed_usd numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_current_month text := to_char(timezone('utc', now()), 'YYYY-MM');
  v_requested numeric(14,8) := round(coalesce(p_requested_usd, 0), 8);
  v_allowed numeric(14,8) := least(
    greatest(round(coalesce(p_allowed_usd, 0), 8), 0),
    10.00000000
  );
  v_spent numeric(14,8);
  v_reserved numeric(14,8);
  v_reservation_id uuid := extensions.gen_random_uuid();
begin
  if p_month is distinct from v_current_month or v_requested <= 0 then
    return null;
  end if;

  insert into public.news_ai_spend (month)
  values (v_current_month)
  on conflict (month) do nothing;

  select spent_usd, reserved_usd
  into v_spent, v_reserved
  from public.news_ai_spend
  where month = v_current_month
  for update;

  if v_spent + v_reserved + v_requested > v_allowed then
    return null;
  end if;

  update public.news_ai_spend
  set reserved_usd = reserved_usd + v_requested,
      updated_at = now()
  where month = v_current_month;

  insert into public.news_ai_budget_reservations (
    id,
    month,
    reserved_usd
  )
  values (
    v_reservation_id,
    v_current_month,
    v_requested
  );

  return v_reservation_id;
end;
$fn$;

create or replace function public.settle_news_ai_budget(
  p_reservation_id uuid,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_actual_usd numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_reservation public.news_ai_budget_reservations%rowtype;
  v_actual numeric(14,8) := round(coalesce(p_actual_usd, -1), 8);
begin
  select *
  into v_reservation
  from public.news_ai_budget_reservations
  where id = p_reservation_id
  for update;

  if not found
    or v_reservation.status <> 'active'
    or coalesce(p_input_tokens, -1) < 0
    or coalesce(p_output_tokens, -1) < 0
    or v_actual < 0
    or v_actual > v_reservation.reserved_usd then
    return false;
  end if;

  update public.news_ai_spend
  set input_tokens = input_tokens + p_input_tokens,
      output_tokens = output_tokens + p_output_tokens,
      spent_usd = spent_usd + v_actual,
      reserved_usd = greatest(reserved_usd - v_reservation.reserved_usd, 0),
      updated_at = now()
  where month = v_reservation.month;

  update public.news_ai_budget_reservations
  set status = 'settled',
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      actual_usd = v_actual,
      settled_at = now()
  where id = p_reservation_id
    and status = 'active';

  return true;
end;
$fn$;

create or replace function public.release_news_ai_budget_reservation(
  p_reservation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_reservation public.news_ai_budget_reservations%rowtype;
begin
  select *
  into v_reservation
  from public.news_ai_budget_reservations
  where id = p_reservation_id
  for update;

  if not found or v_reservation.status <> 'active' then
    return false;
  end if;

  update public.news_ai_spend
  set reserved_usd = greatest(reserved_usd - v_reservation.reserved_usd, 0),
      updated_at = now()
  where month = v_reservation.month;

  update public.news_ai_budget_reservations
  set status = 'released',
      released_at = now()
  where id = p_reservation_id
    and status = 'active';

  return true;
end;
$fn$;

revoke execute on function public.get_pending_for_enrichment(integer)
  from public, anon, authenticated;
revoke execute on function public.try_acquire_news_pipeline_lease(text, integer)
  from public, anon, authenticated;
revoke execute on function public.release_news_pipeline_lease(text, uuid)
  from public, anon, authenticated;
revoke execute on function public.reserve_news_ai_budget(text, numeric, numeric)
  from public, anon, authenticated;
revoke execute on function public.settle_news_ai_budget(uuid, bigint, bigint, numeric)
  from public, anon, authenticated;
revoke execute on function public.release_news_ai_budget_reservation(uuid)
  from public, anon, authenticated;

grant execute on function public.get_pending_for_enrichment(integer)
  to service_role;
grant execute on function public.try_acquire_news_pipeline_lease(text, integer)
  to service_role;
grant execute on function public.release_news_pipeline_lease(text, uuid)
  to service_role;
grant execute on function public.reserve_news_ai_budget(text, numeric, numeric)
  to service_role;
grant execute on function public.settle_news_ai_budget(uuid, bigint, bigint, numeric)
  to service_role;
grant execute on function public.release_news_ai_budget_reservation(uuid)
  to service_role;

notify pgrst, 'reload schema';

commit;
