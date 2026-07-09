-- Entity intelligence foundation: track people, companies, and themes
-- across the market — the layer beyond source-based news.
--
-- ATTRIBUTION RULES (house law, enforced at the drafting desk):
-- published AMARI-voice synthesis aggregates to company/industry level;
-- individuals are named only when citing genuinely public record, with a
-- link, sparingly; never imply a relationship. Entity rows here are an
-- internal discovery index, never published as-is.
--
-- Discovery starts free: per-entity Google News RSS queries in the
-- existing ingest pipeline. A semantic search API can slot in later
-- behind the same shape.

begin;

create table if not exists public.tracked_entities (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('person', 'company', 'theme')),
  name text not null,
  aliases text[] not null default '{}',
  industry text,
  region text check (region in ('australia', 'uk', 'africa', 'americas', 'global')),
  house boolean not null default false,      -- house-tracked core vs member-added
  active boolean not null default true,
  status text not null default 'approved' check (status in ('candidate', 'approved', 'retired')),
  notes text,                                 -- internal only
  last_checked_at timestamptz,
  created_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  unique (kind, name)
);

create index if not exists tracked_entities_active_idx
  on public.tracked_entities (active, house, last_checked_at nulls first);

create table if not exists public.member_entity_follows (
  member_id uuid not null references public.members(id) on delete cascade,
  entity_id bigint not null references public.tracked_entities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, entity_id)
);

alter table public.news_articles
  add column if not exists entities text[] not null default '{}';

create index if not exists news_articles_entities_idx
  on public.news_articles using gin (entities);

-- RLS: entities are readable by members (to follow them); writes are
-- service/desk only. Follows are member-own.
alter table public.tracked_entities enable row level security;
alter table public.member_entity_follows enable row level security;

drop policy if exists "entities_member_read" on public.tracked_entities;
create policy "entities_member_read"
  on public.tracked_entities for select
  to authenticated
  using (is_active_member() and status = 'approved' and active);

drop policy if exists "entity_follows_own" on public.member_entity_follows;
create policy "entity_follows_own"
  on public.member_entity_follows for all
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- Feed ranking: articles about entities you follow get a strong boost,
-- alongside the existing interest-tag boost.
drop function if exists public.get_news_feed(integer, integer);

create or replace function public.get_news_feed(
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id bigint,
  source_name text,
  source_region text,
  url text,
  title text,
  snippet text,
  image_url text,
  published_at timestamptz,
  topics text[],
  regions text[],
  entities text[],
  summary text,
  media_type content_media_type,
  duration_seconds integer,
  format_meta jsonb,
  is_saved boolean,
  score double precision
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not is_active_member() then
    return;
  end if;

  return query
  select
    a.id,
    s.name,
    s.region,
    a.url,
    a.title,
    a.snippet,
    a.image_url,
    coalesce(a.published_at, a.ingested_at),
    a.topics,
    a.regions,
    a.entities,
    a.summary,
    a.media_type,
    a.duration_seconds,
    a.format_meta,
    (sa.article_id is not null),
    (
      exp(-extract(epoch from (now() - coalesce(a.published_at, a.ingested_at))) / 3600.0 / 48.0)
      * s.default_weight
      * (0.5 + coalesce(a.relevance, 50) / 100.0)
      * (1.0 + least(coalesce(im.tag_boost, 0.0), 2.0))
      * (1.0 + least(coalesce(ef.entity_boost, 0.0), 1.5))
    )::double precision as score
  from public.news_articles as a
  join public.news_sources as s on s.id = a.source_id
  left join public.saved_articles as sa
    on sa.article_id = a.id and sa.member_id = auth.uid()
  left join lateral (
    select sum(i.weight) * 0.35 as tag_boost
    from public.member_feed_interests as i
    where i.member_id = auth.uid()
      and (i.tag = any(a.topics) or i.tag = any(a.regions))
  ) as im on true
  left join lateral (
    select count(*) * 0.75 as entity_boost
    from public.member_entity_follows as f
    join public.tracked_entities as e on e.id = f.entity_id
    where f.member_id = auth.uid()
      and e.name = any(a.entities)
  ) as ef on true
  where a.status = 'published'
    and coalesce(a.published_at, a.ingested_at) > now() - interval '14 days'
    and not exists (
      select 1 from public.news_events as h
      where h.member_id = auth.uid()
        and h.article_id = a.id
        and h.event_type = 'hide'
    )
  order by score desc, coalesce(a.published_at, a.ingested_at) desc
  limit greatest(coalesce(p_limit, 20), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$fn$;

revoke execute on function public.get_news_feed(integer, integer) from public, anon;
grant execute on function public.get_news_feed(integer, integer) to authenticated;

-- Service helper: when an entity search rediscovers an article already
-- ingested, append the entity tag instead of duplicating the row.
create or replace function public.append_article_entity(p_url_hash text, p_entity text)
returns void language sql security definer set search_path = public as $$
  update public.news_articles
  set entities = array_append(entities, p_entity)
  where url_hash = p_url_hash
    and not (p_entity = any(entities));
$$;

revoke execute on function public.append_article_entity(text, text) from public, anon, authenticated;
grant execute on function public.append_article_entity(text, text) to service_role;

-- Seed: corridor-relevant house entities (news-productive starters; the
-- 268-company commercial mapping master imports via the desk next).
insert into public.tracked_entities (kind, name, aliases, industry, region, house, status)
values
  ('company', 'LemFi', '{}', 'fintech-remittance', 'global', true, 'approved'),
  ('company', 'Flutterwave', '{}', 'fintech-payments', 'africa', true, 'approved'),
  ('company', 'Paystack', '{}', 'fintech-payments', 'africa', true, 'approved'),
  ('company', 'Moniepoint', '{}', 'fintech-banking', 'africa', true, 'approved'),
  ('company', 'Chipper Cash', '{}', 'fintech-remittance', 'africa', true, 'approved'),
  ('company', 'Interswitch', '{}', 'fintech-infrastructure', 'africa', true, 'approved'),
  ('company', 'M-KOPA', '{}', 'fintech-assets', 'africa', true, 'approved'),
  ('company', 'Wise', '{"TransferWise"}', 'fintech-remittance', 'global', true, 'approved'),
  ('company', 'Revolut', '{}', 'fintech-banking', 'global', true, 'approved'),
  ('company', 'MTN Group', '{"MTN"}', 'telecom', 'africa', true, 'approved'),
  ('company', 'Safaricom', '{"M-Pesa"}', 'telecom-fintech', 'africa', true, 'approved'),
  ('company', 'Airtel Africa', '{}', 'telecom', 'africa', true, 'approved'),
  ('company', 'Dangote Group', '{"Dangote"}', 'industrials', 'africa', true, 'approved'),
  ('company', 'Access Bank', '{}', 'banking', 'africa', true, 'approved'),
  ('company', 'Standard Bank', '{}', 'banking', 'africa', true, 'approved'),
  ('company', 'Ecobank', '{}', 'banking', 'africa', true, 'approved'),
  ('company', 'Zeller', '{}', 'fintech-payments', 'australia', true, 'approved'),
  ('company', 'Airwallex', '{}', 'fintech-payments', 'australia', true, 'approved'),
  ('theme', 'Africa-Australia trade corridor', '{"Australia Africa trade"}', 'corridor', 'global', true, 'approved'),
  ('theme', 'African diaspora investment', '{"diaspora capital Africa"}', 'capital', 'global', true, 'approved')
on conflict (kind, name) do nothing;

notify pgrst, 'reload schema';

commit;
