-- Video-ready content model. Additive and backward-compatible: the feed
-- becomes format-agnostic so articles, editorial, video, and audio all flow
-- through one pipeline and one ranking. Existing rows stay 'article'.
--
-- Design (per content-architecture research): a single content table with a
-- media_type and a format_meta JSONB, ranked on interest tags + engagement
-- without the ranking caring about format. Rendering is format-specific;
-- ranking is not.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'content_media_type') then
    create type content_media_type as enum ('article', 'editorial', 'video', 'audio', 'digest');
  end if;
end$$;

alter table public.news_articles
  add column if not exists media_type content_media_type not null default 'article',
  add column if not exists duration_seconds integer,        -- video/audio length; null for text
  add column if not exists format_meta jsonb not null default '{}'::jsonb;
  -- format_meta examples:
  --   video: { "thumbnail_url":..., "aspect_ratio":"16:9", "captions_url":..., "hls_url":... }
  --   audio: { "narrator":..., "transcript_url":..., "stream_url":... }

create index if not exists news_articles_media_type_idx
  on public.news_articles (media_type);

-- Extend the feed RPC to return format so the client renders format-aware.
-- Return signature changes, so drop + recreate.
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

revoke execute on function public.get_news_feed(integer, integer) from public, anon;
grant execute on function public.get_news_feed(integer, integer) to authenticated;

notify pgrst, 'reload schema';

commit;
