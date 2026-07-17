-- Permit eligible pending members to declare briefing interests during
-- onboarding while keeping all direct writes behind the RPC.

begin;

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

notify pgrst, 'reload schema';

commit;
