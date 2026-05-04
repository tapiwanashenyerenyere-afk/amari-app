-- Restore Pulse RPCs used by the mobile client.
-- The linked production database can drift from local migrations; these
-- idempotent RPCs keep App Review/member access working without broad db push.

begin;

drop policy if exists "pulse_select" on public.pulse_editions;

create or replace function public.get_pulse_feed(p_limit integer default 8)
returns setof public.pulse_editions
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_tier membership_tier;
begin
  if not is_active_member() then
    return;
  end if;

  v_tier := get_member_tier();

  return query
  select
    pe.id,
    pe.publish_date,
    pe.status,
    pe.headline,
    case when tier_level(v_tier) >= 2 then pe.summary_content else null end,
    case when tier_level(v_tier) >= 3 then pe.full_content else null end,
    pe.stats,
    pe.hero_image_path,
    pe.created_at,
    pe.updated_at
  from public.pulse_editions as pe
  where pe.status in ('published', 'archived')
  order by pe.publish_date desc
  limit greatest(coalesce(p_limit, 8), 1);
end;
$fn$;

create or replace function public.get_pulse_edition(p_id integer)
returns setof public.pulse_editions
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_tier membership_tier;
begin
  if not is_active_member() then
    return;
  end if;

  v_tier := get_member_tier();

  return query
  select
    pe.id,
    pe.publish_date,
    pe.status,
    pe.headline,
    case when tier_level(v_tier) >= 2 then pe.summary_content else null end,
    case when tier_level(v_tier) >= 3 then pe.full_content else null end,
    pe.stats,
    pe.hero_image_path,
    pe.created_at,
    pe.updated_at
  from public.pulse_editions as pe
  where pe.id = p_id
    and pe.status in ('published', 'archived');
end;
$fn$;

revoke execute on function public.get_pulse_feed(integer) from public, anon;
revoke execute on function public.get_pulse_edition(integer) from public, anon;
grant execute on function public.get_pulse_feed(integer) to authenticated;
grant execute on function public.get_pulse_edition(integer) to authenticated;

notify pgrst, 'reload schema';

commit;
