-- Harden entity following behind an active-member RPC and make feed reasons
-- reflect only follows that are currently eligible to affect ranking.

begin;

revoke select on table public.tracked_entities from authenticated;
grant select (id, kind, name, industry, region)
  on table public.tracked_entities to authenticated;

drop policy if exists "entity_follows_own" on public.member_entity_follows;
drop policy if exists "entity_follows_active_select_own" on public.member_entity_follows;
create policy "entity_follows_active_select_own"
  on public.member_entity_follows for select
  to authenticated
  using (member_id = auth.uid() and public.is_active_member());

grant select on table public.member_entity_follows to authenticated;
revoke all on table public.member_entity_follows from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.member_entity_follows from authenticated;

create or replace function public.set_entity_follow(
  p_entity_id bigint,
  p_follow boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null or not public.is_active_member() then
    raise exception 'Active membership required';
  end if;

  if coalesce(p_follow, false) then
    if not exists (
      select 1
      from public.tracked_entities as e
      where e.id = p_entity_id
        and e.active
        and e.status = 'approved'
    ) then
      raise exception 'Entity is not available to follow';
    end if;

    insert into public.member_entity_follows (member_id, entity_id)
    select auth.uid(), e.id
    from public.tracked_entities as e
    where e.id = p_entity_id
      and e.active
      and e.status = 'approved'
    on conflict (member_id, entity_id) do nothing;

    return true;
  end if;

  -- Unfollowing stays available after an entity is retired or disabled.
  delete from public.member_entity_follows
  where member_id = auth.uid() and entity_id = p_entity_id;
  return false;
end;
$fn$;

revoke execute on function public.set_entity_follow(bigint, boolean) from public, anon;
grant execute on function public.set_entity_follow(bigint, boolean) to authenticated;

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
  matched_entity text,
  score double precision
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_active_member() then
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
    ef.matched_entity,
    (
      exp(-greatest(extract(epoch from (now() - coalesce(a.published_at, a.ingested_at))), 0) / 3600.0 / 48.0)
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
    select
      count(*) * 0.75 as entity_boost,
      min(e.name) as matched_entity
    from public.member_entity_follows as f
    join public.tracked_entities as e on e.id = f.entity_id
    where f.member_id = auth.uid()
      and e.active
      and e.status = 'approved'
      and e.name = any(a.entities)
  ) as ef on true
  where a.status = 'published'
    and coalesce(a.published_at, a.ingested_at) > now() - interval '14 days'
    and coalesce(a.published_at, a.ingested_at) <= now() + interval '15 minutes'
    and not exists (
      select 1 from public.news_events as h
      where h.member_id = auth.uid()
        and h.article_id = a.id
        and h.event_type = 'hide'
    )
  order by score desc, coalesce(a.published_at, a.ingested_at) desc, a.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$fn$;

revoke execute on function public.get_news_feed(integer, integer) from public, anon;
grant execute on function public.get_news_feed(integer, integer) to authenticated;

notify pgrst, 'reload schema';

commit;
