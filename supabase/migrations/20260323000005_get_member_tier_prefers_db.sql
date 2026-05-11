begin;

create or replace function public.get_member_tier()
returns membership_tier
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_tier membership_tier;
begin
  select tier
  into v_tier
  from public.members
  where id = auth.uid()
    and status = 'active';

  if v_tier is not null then
    return v_tier;
  end if;

  begin
    v_tier := (auth.jwt() -> 'app_metadata' ->> 'tier')::membership_tier;
  exception when others then
    v_tier := null;
  end;

  return coalesce(v_tier, 'member'::membership_tier);
end;
$fn$;

commit;
