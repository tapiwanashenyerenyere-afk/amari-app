\set ON_ERROR_STOP on

create extension if not exists pgtap with schema extensions;

select plan(20);

create temporary table expansion_before as
select
  (select count(*) from public.news_sources) as source_count,
  (select count(*) from public.tracked_entities) as entity_count,
  (select to_jsonb(s) from public.news_sources s where s.feed_url = 'https://techcabal.com/feed') as baseline_source,
  (select to_jsonb(e) from public.tracked_entities e where e.kind = 'company' and e.name = 'LemFi') as baseline_entity;

-- Semantic replay of every expansion row using the migration's exact conflict
-- targets. The pgTAP container mounts tests separately from migration files.
insert into public.news_sources (name, home_url, feed_url, region, default_weight, active)
select name, home_url, feed_url, region, default_weight, active
from public.news_sources
where id > 12
on conflict (feed_url) do nothing;

insert into public.tracked_entities (kind, name, aliases, industry, region, house, active, status)
select kind, name, aliases, industry, region, house, active, status
from public.tracked_entities
where id > 20
on conflict (kind, name) do nothing;

select is((select count(*) from public.news_sources), 63::bigint, 'clean catalogue has 63 sources');
select is((select count(*) from public.tracked_entities), 65::bigint, 'clean catalogue has 65 entities');
select is((select count(*) from public.news_sources where active), 63::bigint, 'all clean-catalogue sources are active');
select is((select count(*) from public.news_sources where id > 12), 51::bigint, 'migration contributes 51 sources');
select is((select count(*) from public.news_sources where id > 12 and feed_url like 'https://news.google.com/%'), 30::bigint, 'migration contributes 30 Google fallbacks');
select is((select count(*) from public.news_sources where id > 12 and feed_url not like 'https://news.google.com/%'), 21::bigint, 'migration contributes 21 direct feeds');
select is((select count(*) from public.news_sources where id > 12 and region = 'global'), 15::bigint, 'multi-region sources use global');
select is((select count(*) from public.news_sources where id > 12 and feed_url like 'https://news.google.com/%' and feed_url not like '%hl=en-AU&gl=AU&ceid=AU:en'), 0::bigint, 'every Google URL is AU-localised');
select is((select count(*) from public.tracked_entities where id > 20), 45::bigint, 'migration contributes 45 entities');
select is((select count(*) from public.tracked_entities where id > 20 and kind = 'company'), 19::bigint, 'entity expansion has 19 companies');
select is((select count(*) from public.tracked_entities where id > 20 and kind = 'person'), 10::bigint, 'entity expansion has 10 people');
select is((select count(*) from public.tracked_entities where id > 20 and kind = 'theme'), 16::bigint, 'entity expansion has 16 themes');
select is((select count(*) from public.tracked_entities where id > 20 and (not house or not active or status <> 'approved')), 0::bigint, 'all added entities are active approved house entities');
select is((select aliases from public.tracked_entities where kind = 'theme' and name = 'Powerlist'), array['Powerful Media Powerlist']::text[], 'Powerlist alias is exact');
select is((select aliases from public.tracked_entities where kind = 'theme' and name = 'Black British Business Awards'), array['BBBA']::text[], 'Black British Business Awards alias is exact');
select is((select concat_ws('|', industry, region) from public.tracked_entities where kind = 'theme' and name = 'ADCOLOR'), 'creative-industries|americas', 'ADCOLOR metadata is exact');
select is((select count(*) from public.news_sources), (select source_count from expansion_before), 'source replay inserts zero rows');
select is((select count(*) from public.tracked_entities), (select entity_count from expansion_before), 'entity replay inserts zero rows');
select is((select to_jsonb(s) from public.news_sources s where s.feed_url = 'https://techcabal.com/feed'), (select baseline_source from expansion_before), 'replay preserves existing source operational state');
select is((select to_jsonb(e) from public.tracked_entities e where e.kind = 'company' and e.name = 'LemFi'), (select baseline_entity from expansion_before), 'replay preserves existing entity metadata');

select * from finish();
