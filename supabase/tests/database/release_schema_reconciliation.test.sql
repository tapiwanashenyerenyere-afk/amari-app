begin;

select plan(9);

select ok(
  exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20260718000001'
  ),
  'forward-only release reconciliation is recorded in migration history'
);

select has_function(
  'public',
  'renew_news_pipeline_lease',
  array['text', 'uuid', 'integer'],
  'lease renewal exists after reconciliation'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.renew_news_pipeline_lease(text,uuid,integer)',
    'EXECUTE'
  ),
  'service role can renew pipeline leases'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.renew_news_pipeline_lease(text,uuid,integer)',
    'EXECUTE'
  ),
  'members cannot renew pipeline leases'
);

select is(
  (
    select name
    from public.news_sources
    where feed_url = 'https://news.google.com/rss/search?q=%22African+Australian%22+(business+OR+founder+OR+entrepreneur)&hl=en-AU&gl=AU&ceid=AU:en'
  ),
  'Google News discovery',
  'canonical search feed has a truthful discovery identity'
);

select has_function(
  'public',
  'is_pending_member',
  array[]::text[],
  'pending-member eligibility helper exists after reconciliation'
);

select ok(
  not has_table_privilege('authenticated', 'public.tracked_entities', 'SELECT'),
  'authenticated members do not have unrestricted entity-table reads'
);

select ok(
  has_column_privilege('authenticated', 'public.tracked_entities', 'name', 'SELECT'),
  'authenticated members can read the safe entity catalogue columns'
);

select ok(
  not has_column_privilege('authenticated', 'public.tracked_entities', 'aliases', 'SELECT'),
  'authenticated members cannot read entity aliases'
);

select * from finish();

rollback;
