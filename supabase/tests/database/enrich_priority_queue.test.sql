begin;

select plan(41);

insert into public.news_sources (
  name,
  feed_url,
  region,
  default_weight,
  active
)
values
  ('pgTAP priority high', 'https://pgtap.invalid/pr-b/high', 'global', 2.00, true),
  ('pgTAP priority low', 'https://pgtap.invalid/pr-b/low', 'global', 1.00, true);

insert into public.news_articles (
  source_id,
  url,
  url_hash,
  title,
  published_at,
  ingested_at,
  status
)
values
  ((select id from public.news_sources where feed_url = 'https://pgtap.invalid/pr-b/high'),
   'https://pgtap.invalid/pr-b/high-newest', 'pgtap-pr-b-high-newest',
   'pgtap:b:high newest', now() - interval '30 minutes', now(), 'pending'),
  ((select id from public.news_sources where feed_url = 'https://pgtap.invalid/pr-b/high'),
   'https://pgtap.invalid/pr-b/tie-old', 'pgtap-pr-b-tie-old',
   'pgtap:b:tie older id', now() - interval '1 hour', now(), 'pending'),
  ((select id from public.news_sources where feed_url = 'https://pgtap.invalid/pr-b/high'),
   'https://pgtap.invalid/pr-b/tie-new', 'pgtap-pr-b-tie-new',
   'pgtap:b:tie newer id', now() - interval '1 hour', now(), 'pending'),
  ((select id from public.news_sources where feed_url = 'https://pgtap.invalid/pr-b/low'),
   'https://pgtap.invalid/pr-b/low-newest', 'pgtap-pr-b-low-newest',
   'pgtap:b:low newest', now() - interval '1 minute', now(), 'pending'),
  ((select id from public.news_sources where feed_url = 'https://pgtap.invalid/pr-b/high'),
   'https://pgtap.invalid/pr-b/stale', 'pgtap-pr-b-stale',
   'pgtap:b:stale', now() - interval '15 days', now(), 'pending');

select has_index(
  'public',
  'news_articles',
  'news_articles_pending_effective_idx',
  'pending effective-date index exists'
);

select results_eq(
  $$
    select title
    from public.get_pending_for_enrichment(100)
    where title like 'pgtap:b:%'
  $$,
  $$
    values
      ('pgtap:b:high newest'::text),
      ('pgtap:b:tie newer id'::text),
      ('pgtap:b:tie older id'::text),
      ('pgtap:b:low newest'::text)
  $$,
  'queue orders by weight, effective date, then id'
);

select is(
  (select count(*) from public.get_pending_for_enrichment(100) where title = 'pgtap:b:stale'),
  0::bigint,
  'articles older than 14 days are excluded'
);

select is(
  (select count(*) from public.get_pending_for_enrichment(0)),
  1::bigint,
  'queue limit is clamped to at least one'
);

select ok(
  has_function_privilege('service_role', 'public.get_pending_for_enrichment(integer)', 'EXECUTE'),
  'service role can read the queue'
);
select ok(
  not has_function_privilege('anon', 'public.get_pending_for_enrichment(integer)', 'EXECUTE'),
  'anon cannot read the queue'
);
select ok(
  not has_function_privilege('authenticated', 'public.get_pending_for_enrichment(integer)', 'EXECUTE'),
  'authenticated members cannot read the queue'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.get_pending_for_enrichment(integer)'::regprocedure),
  true,
  'queue function is security definer'
);
select ok(
  (select proconfig @> array['search_path=public']
   from pg_proc where oid = 'public.get_pending_for_enrichment(integer)'::regprocedure),
  'queue function has a fixed search path'
);

create temporary table pr_b_state (
  key text primary key,
  id uuid
);

delete from public.news_pipeline_leases where pipeline = 'enrich-news';
insert into pr_b_state (key, id)
values ('lease', public.try_acquire_news_pipeline_lease('enrich-news', 180));

select isnt((select id from pr_b_state where key = 'lease'), null::uuid, 'first lease is acquired');
select is(public.try_acquire_news_pipeline_lease('enrich-news', 180), null::uuid, 'overlapping lease is denied');
select is(public.renew_news_pipeline_lease('enrich-news', extensions.gen_random_uuid(), 180), false, 'wrong lease id cannot renew');
select is(public.renew_news_pipeline_lease('enrich-news', (select id from pr_b_state where key = 'lease'), 180), true, 'lease owner can renew');
select is(public.release_news_pipeline_lease('enrich-news', extensions.gen_random_uuid()), false, 'wrong lease id cannot release');
select is(public.release_news_pipeline_lease('enrich-news', (select id from pr_b_state where key = 'lease')), true, 'owner releases lease');
select isnt(public.try_acquire_news_pipeline_lease('enrich-news', 180), null::uuid, 'lease can be reacquired after release');

select is(
  (select count(*)
   from pg_proc
   where proname in (
     'get_pending_for_enrichment',
      'try_acquire_news_pipeline_lease',
      'renew_news_pipeline_lease',
      'release_news_pipeline_lease',
     'reserve_news_ai_budget',
     'settle_news_ai_budget',
     'release_news_ai_budget_reservation'
   )
   and has_function_privilege('service_role', oid, 'EXECUTE')),
   7::bigint,
  'service role can execute every pipeline primitive'
);
select is(
  (select count(*)
   from pg_proc
   where proname in (
     'get_pending_for_enrichment',
      'try_acquire_news_pipeline_lease',
      'renew_news_pipeline_lease',
      'release_news_pipeline_lease',
     'reserve_news_ai_budget',
     'settle_news_ai_budget',
     'release_news_ai_budget_reservation'
   )
   and has_function_privilege('anon', oid, 'EXECUTE')),
  0::bigint,
  'anon cannot execute pipeline primitives'
);
select is(
  (select count(*)
   from pg_proc
   where proname in (
     'get_pending_for_enrichment',
      'try_acquire_news_pipeline_lease',
      'renew_news_pipeline_lease',
      'release_news_pipeline_lease',
     'reserve_news_ai_budget',
     'settle_news_ai_budget',
     'release_news_ai_budget_reservation'
   )
   and has_function_privilege('authenticated', oid, 'EXECUTE')),
  0::bigint,
  'authenticated members cannot execute pipeline primitives'
);
select is(
  (select count(*)
   from pg_proc
   where proname in (
     'get_pending_for_enrichment',
      'try_acquire_news_pipeline_lease',
      'renew_news_pipeline_lease',
      'release_news_pipeline_lease',
     'reserve_news_ai_budget',
     'settle_news_ai_budget',
     'release_news_ai_budget_reservation'
   )
   and prosecdef),
   7::bigint,
  'all pipeline primitives are security definer'
);
select is(
  (select count(*)
   from pg_proc
   where proname in (
     'get_pending_for_enrichment',
      'try_acquire_news_pipeline_lease',
      'renew_news_pipeline_lease',
      'release_news_pipeline_lease',
     'reserve_news_ai_budget',
     'settle_news_ai_budget',
     'release_news_ai_budget_reservation'
   )
   and proconfig @> array['search_path=public']),
   7::bigint,
  'all pipeline primitives have a fixed search path'
);

delete from public.news_ai_budget_reservations;
delete from public.news_ai_spend
where month = to_char(timezone('utc', now()), 'YYYY-MM');

insert into pr_b_state (key, id)
values (
  'reservation-settle',
  public.reserve_news_ai_budget(
    to_char(timezone('utc', now()), 'YYYY-MM'),
    0.60000000,
    1.00000000
  )
);

select isnt((select id from pr_b_state where key = 'reservation-settle'), null::uuid, 'first budget reservation succeeds');
select is(
  (select reserved_usd from public.news_ai_spend where month = to_char(timezone('utc', now()), 'YYYY-MM')),
  0.60000000::numeric,
  'reservation is atomically reflected in the ledger'
);
select is(
  public.reserve_news_ai_budget(to_char(timezone('utc', now()), 'YYYY-MM'), 0.50000000, 1.00000000),
  null::uuid,
  'overlapping reservations cannot exceed the pacing allowance'
);
select is(
  public.settle_news_ai_budget((select id from pr_b_state where key = 'reservation-settle'), 120, 40, 0.40000000),
  true,
  'active reservation settles once'
);
select is(
  public.settle_news_ai_budget((select id from pr_b_state where key = 'reservation-settle'), 120, 40, 0.40000000),
  false,
  'settlement replay is rejected'
);
select is(
  (select spent_usd from public.news_ai_spend where month = to_char(timezone('utc', now()), 'YYYY-MM')),
  0.40000000::numeric,
  'settlement records actual spend'
);
select is(
  (select reserved_usd from public.news_ai_spend where month = to_char(timezone('utc', now()), 'YYYY-MM')),
  0.00000000::numeric,
  'settlement clears the conservative reserve'
);
select is(
  (select input_tokens from public.news_ai_spend where month = to_char(timezone('utc', now()), 'YYYY-MM')),
  120::bigint,
  'settlement records input usage'
);
select is(
  (select output_tokens from public.news_ai_spend where month = to_char(timezone('utc', now()), 'YYYY-MM')),
  40::bigint,
  'settlement records output usage'
);

insert into pr_b_state (key, id)
values (
  'reservation-release',
  public.reserve_news_ai_budget(to_char(timezone('utc', now()), 'YYYY-MM'), 0.20000000, 1.00000000)
);
select isnt((select id from pr_b_state where key = 'reservation-release'), null::uuid, 'releasable reservation succeeds');
select is(public.release_news_ai_budget_reservation((select id from pr_b_state where key = 'reservation-release')), true, 'active reservation releases once');
select is(public.release_news_ai_budget_reservation((select id from pr_b_state where key = 'reservation-release')), false, 'release replay is rejected');
select is(
  public.reserve_news_ai_budget(to_char(timezone('utc', now() - interval '1 month'), 'YYYY-MM'), 0.10000000, 1.00000000),
  null::uuid,
  'a reservation cannot cross the UTC month boundary'
);
select is(
  public.reserve_news_ai_budget(to_char(timezone('utc', now()), 'YYYY-MM'), 10.10000000, 100.00000000),
  null::uuid,
  'database hard cap remains ten dollars even with a larger caller allowance'
);

insert into pr_b_state (key, id)
values (
  'reservation-crash',
  public.reserve_news_ai_budget(to_char(timezone('utc', now()), 'YYYY-MM'), 0.10000000, 1.00000000)
);
select isnt((select id from pr_b_state where key = 'reservation-crash'), null::uuid, 'crash-safe reservation is durable');
select is(
  (select reserved_usd from public.news_ai_spend where month = to_char(timezone('utc', now()), 'YYYY-MM')),
  0.10000000::numeric,
  'unsettled reservation remains conservatively counted'
);
select is(
  (select status from public.news_ai_budget_reservations where id = (select id from pr_b_state where key = 'reservation-crash')),
  'active'::text,
  'crash-safe reservation stays active'
);
select is(
  public.reserve_news_ai_budget(to_char(timezone('utc', now()), 'YYYY-MM'), 0.51000000, 1.00000000),
  null::uuid,
  'retained reservation continues blocking overspend'
);
select is((select relrowsecurity from pg_class where oid = 'public.news_pipeline_leases'::regclass), true, 'lease table has RLS');
select is((select relrowsecurity from pg_class where oid = 'public.news_ai_budget_reservations'::regclass), true, 'reservation table has RLS');

select * from finish();
rollback;
