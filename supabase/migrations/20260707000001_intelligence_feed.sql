-- Intelligence feed foundation: external news ingestion, member interests,
-- engagement signals, and the scored personalised feed RPC.
--
-- Content posture: headline + feed-provided snippet + attribution + link-out
-- only. Full article text is never stored or republished.
--
-- Data posture: engagement signals are consent-scoped, member-owned rows used
-- solely to rank each member's own feed. Nothing here is exposed to other
-- members or external parties.

begin;

-- ─── Tables ──────────────────────────────────────────────────────────────

create table if not exists public.news_sources (
  id bigint generated always as identity primary key,
  name text not null,
  home_url text,
  feed_url text not null unique,
  region text not null check (region in ('australia', 'uk', 'africa', 'americas', 'global')),
  default_weight numeric(4,2) not null default 1.00,
  active boolean not null default true,
  last_fetched_at timestamptz,
  last_status text,
  fail_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id bigint generated always as identity primary key,
  source_id bigint not null references public.news_sources(id) on delete cascade,
  url text not null,
  url_hash text not null unique,
  title text not null,
  snippet text,
  image_url text,
  published_at timestamptz,
  ingested_at timestamptz not null default now(),
  topics text[] not null default '{}',
  regions text[] not null default '{}',
  relevance smallint check (relevance between 0 and 100),
  summary text,
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_articles_feed_idx
  on public.news_articles (status, published_at desc nulls last);
create index if not exists news_articles_pending_idx
  on public.news_articles (ingested_at)
  where status = 'pending';
create index if not exists news_articles_topics_idx
  on public.news_articles using gin (topics);
create index if not exists news_articles_regions_idx
  on public.news_articles using gin (regions);

create table if not exists public.member_feed_interests (
  member_id uuid not null references public.members(id) on delete cascade,
  tag text not null check (char_length(tag) between 2 and 40),
  weight real not null default 1.0 check (weight between 0.0 and 5.0),
  declared boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (member_id, tag)
);

create table if not exists public.news_events (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  article_id bigint not null references public.news_articles(id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'open', 'dwell', 'save', 'unsave', 'hide')),
  value smallint not null default 1,
  dwell_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists news_events_member_idx
  on public.news_events (member_id, created_at desc);
create index if not exists news_events_article_idx
  on public.news_events (article_id);

create table if not exists public.saved_articles (
  member_id uuid not null references public.members(id) on delete cascade,
  article_id bigint not null references public.news_articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, article_id)
);

-- ─── Row level security ──────────────────────────────────────────────────

alter table public.news_sources enable row level security;
alter table public.news_articles enable row level security;
alter table public.member_feed_interests enable row level security;
alter table public.news_events enable row level security;
alter table public.saved_articles enable row level security;

-- news_sources: service-role only (ingestion pipeline); no client policies.

drop policy if exists "news_articles_member_select" on public.news_articles;
create policy "news_articles_member_select"
  on public.news_articles for select
  to authenticated
  using (status = 'published' and is_active_member());

drop policy if exists "feed_interests_own" on public.member_feed_interests;
create policy "feed_interests_own"
  on public.member_feed_interests for all
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists "news_events_insert_own" on public.news_events;
create policy "news_events_insert_own"
  on public.news_events for insert
  to authenticated
  with check (member_id = auth.uid() and is_active_member());

drop policy if exists "saved_articles_own" on public.saved_articles;
create policy "saved_articles_own"
  on public.saved_articles for all
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- ─── Feed RPC ────────────────────────────────────────────────────────────
-- Score = recency decay x source weight x classifier relevance x interest match.
-- Recency uses a 48-hour exponential time constant so the feed stays fresh
-- without hard cutoffs. Interest match sums the member's tag weights over the
-- article's topics and regions, dampened so no single tag dominates.

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
  summary text,
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
    a.summary,
    (sa.article_id is not null),
    (
      exp(-extract(epoch from (now() - coalesce(a.published_at, a.ingested_at))) / 3600.0 / 48.0)
      * s.default_weight
      * (0.5 + coalesce(a.relevance, 50) / 100.0)
      * (1.0 + least(coalesce(im.tag_boost, 0.0), 2.0))
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

-- ─── Saved shelf RPC ─────────────────────────────────────────────────────

create or replace function public.get_saved_articles(p_limit integer default 50)
returns table (
  id bigint,
  source_name text,
  url text,
  title text,
  snippet text,
  image_url text,
  published_at timestamptz,
  saved_at timestamptz
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
    a.url,
    a.title,
    a.snippet,
    a.image_url,
    coalesce(a.published_at, a.ingested_at),
    sa.created_at
  from public.saved_articles as sa
  join public.news_articles as a on a.id = sa.article_id
  join public.news_sources as s on s.id = a.source_id
  where sa.member_id = auth.uid()
  order by sa.created_at desc
  limit greatest(coalesce(p_limit, 50), 1);
end;
$fn$;

-- ─── Interests RPC ───────────────────────────────────────────────────────
-- Replaces the member's declared tags with the supplied set. Learned
-- (declared = false) rows are left untouched.

create or replace function public.set_feed_interests(p_tags text[])
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_tag text;
begin
  if not is_active_member() then
    raise exception 'Not an active member';
  end if;

  if p_tags is null or array_length(p_tags, 1) is null then
    delete from public.member_feed_interests
    where member_id = auth.uid() and declared = true;
    return;
  end if;

  if array_length(p_tags, 1) > 24 then
    raise exception 'Too many interest tags';
  end if;

  delete from public.member_feed_interests
  where member_id = auth.uid()
    and declared = true
    and not (tag = any(p_tags));

  foreach v_tag in array p_tags loop
    if char_length(trim(v_tag)) between 2 and 40 then
      insert into public.member_feed_interests (member_id, tag, weight, declared, updated_at)
      values (auth.uid(), lower(trim(v_tag)), 1.0, true, now())
      on conflict (member_id, tag)
      do update set declared = true, weight = greatest(public.member_feed_interests.weight, 1.0), updated_at = now();
    end if;
  end loop;
end;
$fn$;

-- ─── Engagement events RPC ───────────────────────────────────────────────
-- Batched client capture. Event values are assigned server-side; the client
-- only names the event. Capped per call to bound abuse.

create or replace function public.record_news_events(p_events jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_event jsonb;
  v_type text;
  v_article_id bigint;
  v_dwell_ms integer;
  v_count integer := 0;
begin
  if not is_active_member() then
    return 0;
  end if;

  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    return 0;
  end if;

  for v_event in select * from jsonb_array_elements(p_events) limit 100 loop
    v_type := v_event->>'event_type';
    v_article_id := (v_event->>'article_id')::bigint;
    v_dwell_ms := nullif(v_event->>'dwell_ms', '')::integer;

    if v_type not in ('impression', 'open', 'dwell', 'save', 'unsave', 'hide') then
      continue;
    end if;

    if not exists (select 1 from public.news_articles where id = v_article_id) then
      continue;
    end if;

    insert into public.news_events (member_id, article_id, event_type, value, dwell_ms)
    values (
      auth.uid(),
      v_article_id,
      v_type,
      case v_type
        when 'impression' then 1
        when 'open' then 2
        when 'dwell' then 2
        when 'save' then 3
        when 'unsave' then 0
        when 'hide' then -3
      end,
      v_dwell_ms
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$fn$;

-- ─── Save toggle RPC ─────────────────────────────────────────────────────

create or replace function public.toggle_saved_article(p_article_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_saved boolean;
begin
  if not is_active_member() then
    raise exception 'Not an active member';
  end if;

  if not exists (
    select 1 from public.news_articles
    where id = p_article_id and status = 'published'
  ) then
    raise exception 'Article not available';
  end if;

  if exists (
    select 1 from public.saved_articles
    where member_id = auth.uid() and article_id = p_article_id
  ) then
    delete from public.saved_articles
    where member_id = auth.uid() and article_id = p_article_id;
    v_saved := false;
  else
    insert into public.saved_articles (member_id, article_id)
    values (auth.uid(), p_article_id)
    on conflict do nothing;
    v_saved := true;
  end if;

  insert into public.news_events (member_id, article_id, event_type, value)
  values (auth.uid(), p_article_id, case when v_saved then 'save' else 'unsave' end, case when v_saved then 3 else 0 end);

  return v_saved;
end;
$fn$;

-- ─── Affinity fold (service-scheduled, stage two personalisation) ────────
-- Folds recent engagement into learned tag affinities with an exponential
-- moving average. Intended to run nightly via pg_cron; never client-callable.

create or replace function public.fold_feed_affinities()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_count integer := 0;
begin
  with recent as (
    select
      e.member_id,
      t.tag,
      sum(e.value) as signal
    from public.news_events as e
    join public.news_articles as a on a.id = e.article_id
    cross join lateral unnest(a.topics || a.regions) as t(tag)
    where e.created_at > now() - interval '2 days'
      and e.event_type in ('open', 'dwell', 'save', 'hide')
    group by e.member_id, t.tag
  ),
  folded as (
    insert into public.member_feed_interests (member_id, tag, weight, declared, updated_at)
    select
      r.member_id,
      r.tag,
      least(greatest(0.1 * r.signal, 0.0), 5.0),
      false,
      now()
    from recent as r
    on conflict (member_id, tag)
    do update set
      weight = least(greatest(public.member_feed_interests.weight * 0.9 + excluded.weight, 0.0), 5.0),
      updated_at = now()
    where public.member_feed_interests.declared = false
    returning 1
  )
  select count(*) into v_count from folded;

  return v_count;
end;
$fn$;

-- ─── Grants ──────────────────────────────────────────────────────────────

revoke execute on function public.get_news_feed(integer, integer) from public, anon;
revoke execute on function public.get_saved_articles(integer) from public, anon;
revoke execute on function public.set_feed_interests(text[]) from public, anon;
revoke execute on function public.record_news_events(jsonb) from public, anon;
revoke execute on function public.toggle_saved_article(bigint) from public, anon;
revoke execute on function public.fold_feed_affinities() from public, anon, authenticated;

grant execute on function public.get_news_feed(integer, integer) to authenticated;
grant execute on function public.get_saved_articles(integer) to authenticated;
grant execute on function public.set_feed_interests(text[]) to authenticated;
grant execute on function public.record_news_events(jsonb) to authenticated;
grant execute on function public.toggle_saved_article(bigint) to authenticated;
grant execute on function public.fold_feed_affinities() to service_role;

-- ─── Seed sources ────────────────────────────────────────────────────────
-- Feed URLs verified 6-7 Jul 2026 where noted. Unverified feeds start active;
-- the ingester increments fail_count and they can be disabled from data.

insert into public.news_sources (name, home_url, feed_url, region, default_weight, active)
values
  ('TechCabal', 'https://techcabal.com', 'https://techcabal.com/feed', 'africa', 1.00, true),
  ('Disrupt Africa', 'https://disruptafrica.com', 'https://disruptafrica.com/feed', 'africa', 1.00, true),
  ('How We Made It In Africa', 'https://www.howwemadeitinafrica.com', 'https://www.howwemadeitinafrica.com/feed/', 'africa', 1.00, true),
  ('African Business', 'https://african.business', 'https://african.business/feed', 'africa', 0.90, true),
  ('Ventures Africa', 'https://venturesafrica.com', 'https://venturesafrica.com/feed/', 'africa', 0.80, true),
  ('Lionesses of Africa', 'https://lionessesofafrica.com', 'https://lionessesofafrica.com/blog?format=rss', 'africa', 0.80, true),
  ('Black Enterprise', 'https://www.blackenterprise.com', 'https://www.blackenterprise.com/feed/', 'americas', 1.00, true),
  ('AfroTech', 'https://afrotech.com', 'https://afrotech.com/feed', 'americas', 0.90, true),
  ('The Voice', 'https://www.voice-online.co.uk', 'https://www.voice-online.co.uk/feed/', 'uk', 0.90, true),
  ('SmartCompany', 'https://www.smartcompany.com.au', 'https://www.smartcompany.com.au/feed/', 'australia', 0.90, true),
  ('Startup Daily', 'https://www.startupdaily.net', 'https://www.startupdaily.net/feed/', 'australia', 0.90, true),
  ('African Australian business coverage', 'https://news.google.com', 'https://news.google.com/rss/search?q=%22African+Australian%22+(business+OR+founder+OR+entrepreneur)&hl=en-AU&gl=AU&ceid=AU:en', 'australia', 1.20, true)
on conflict (feed_url) do nothing;

notify pgrst, 'reload schema';

commit;
