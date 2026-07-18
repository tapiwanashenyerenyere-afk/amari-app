-- Reconcile production with the reviewed intelligence release schema.
--
-- Migrations 20260717000001 through 20260717000004 reached production before
-- their final review changes were merged. Supabase records migration versions,
-- so those edited files are not replayed. Keep this forward-only migration even
-- though a clean database already receives the same definitions from the older
-- migration files.

begin;

create or replace function public.renew_news_pipeline_lease(
  p_pipeline text,
  p_lease_id uuid,
  p_lease_seconds integer default 180
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_now timestamptz := clock_timestamp();
  v_seconds integer := least(greatest(coalesce(p_lease_seconds, 180), 30), 900);
  v_rows integer;
begin
  update public.news_pipeline_leases
  set leased_until = v_now + make_interval(secs => v_seconds)
  where pipeline = p_pipeline
    and lease_id = p_lease_id
    and leased_until > v_now;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$fn$;

revoke execute on function public.renew_news_pipeline_lease(text, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.renew_news_pipeline_lease(text, uuid, integer)
  to service_role;

-- Search feeds are discovery mechanisms, not publishers. Keep one honest
-- source identity and preserve each Google headline's publisher suffix.
update public.news_sources
set name = 'Google News discovery',
    home_url = 'https://news.google.com'
where feed_url = 'https://news.google.com/rss/search?q=%22African+Australian%22+(business+OR+founder+OR+entrepreneur)&hl=en-AU&gl=AU&ceid=AU:en';

create or replace function public.is_pending_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.members
    where id = auth.uid() and status::text = 'pending'
  );
$fn$;

revoke execute on function public.is_pending_member() from public, anon;
grant execute on function public.is_pending_member() to authenticated;

drop policy if exists "feed_interests_own" on public.member_feed_interests;
drop policy if exists "feed_interests_active_select_own" on public.member_feed_interests;
create policy "feed_interests_active_select_own"
  on public.member_feed_interests for select
  to authenticated
  using (
    member_id = auth.uid()
    and (
      public.is_active_member()
      or (declared and public.is_pending_member())
    )
  );

grant select on table public.member_feed_interests to authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.member_feed_interests from authenticated;

create or replace function public.set_feed_interests(p_tags text[])
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_tag text;
  v_tags text[];
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select m.status::text
  into v_status
  from public.members as m
  where m.id = auth.uid();

  if v_status is null or v_status not in ('active', 'pending') then
    raise exception 'Member is not eligible to set feed interests';
  end if;

  if p_tags is null or cardinality(p_tags) = 0 then
    delete from public.member_feed_interests
    where member_id = auth.uid() and declared = true;
    return;
  end if;

  if array_ndims(p_tags) <> 1 or cardinality(p_tags) > 24 then
    raise exception 'Too many interest tags';
  end if;

  select coalesce(array_agg(tag order by tag), '{}'::text[])
  into v_tags
  from (
    select distinct lower(trim(raw_tag)) as tag
    from unnest(p_tags) as raw(raw_tag)
    where raw_tag is not null
      and char_length(trim(raw_tag)) between 2 and 40
  ) as normalized;

  delete from public.member_feed_interests
  where member_id = auth.uid()
    and declared = true
    and not (tag = any(v_tags));

  foreach v_tag in array v_tags loop
    insert into public.member_feed_interests (member_id, tag, weight, declared, updated_at)
    values (auth.uid(), v_tag, 1.0, true, now())
    on conflict (member_id, tag)
    do update set
      declared = true,
      weight = greatest(public.member_feed_interests.weight, 1.0),
      updated_at = now();
  end loop;
end;
$fn$;

revoke execute on function public.set_feed_interests(text[]) from public, anon;
grant execute on function public.set_feed_interests(text[]) to authenticated;

revoke select on table public.tracked_entities from authenticated;
grant select (id, kind, name, industry, region)
  on table public.tracked_entities to authenticated;

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
