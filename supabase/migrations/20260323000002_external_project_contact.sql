begin;

alter table public.aligned_tiles
  add column if not exists contact_enabled boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'aligned_tiles_contact_enabled_project_only'
      and conrelid = 'public.aligned_tiles'::regclass
  ) then
    alter table public.aligned_tiles
      add constraint aligned_tiles_contact_enabled_project_only
      check (type = 'project' or contact_enabled = false);
  end if;
end $$;

drop function if exists public.aligned_discovery_tiles(text, integer);

create or replace function public.aligned_discovery_tiles(
  p_type text default null,
  p_limit integer default 40
)
returns table (
  id uuid,
  type text,
  description text,
  tags text[],
  location text,
  image_url text,
  image_path text,
  owner_tier membership_tier,
  contact_enabled boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    t.id,
    t.type,
    t.description,
    t.tags,
    t.location,
    t.image_url,
    t.image_path,
    m.tier as owner_tier,
    coalesce(t.contact_enabled, false) as contact_enabled,
    t.created_at
  from public.aligned_tiles t
  join public.members m
    on m.id = t.user_id
   and m.status = 'active'
  where auth.uid() is not null
    and public.is_active_member()
    and t.is_active = true
    and t.moderation_status = 'approved'
    and public.get_member_tier() = any(t.visibility_tiers)
    and t.user_id <> auth.uid()
    and (p_type is null or t.type = p_type)
    and not exists (
      select 1
      from public.aligned_skips s
      where s.user_id = auth.uid()
        and s.tile_id = t.id
    )
    and not exists (
      select 1
      from public.aligned_interests i
      where i.from_user_id = auth.uid()
        and i.to_tile_id = t.id
    )
    and not exists (
      select 1
      from public.connections c
      where (c.user_a = auth.uid() and c.user_b = t.user_id)
         or (c.user_a = t.user_id and c.user_b = auth.uid())
    )
  order by t.created_at desc
  limit greatest(coalesce(p_limit, 40), 1);
$fn$;

revoke execute on function public.aligned_discovery_tiles(text, integer) from public, anon, authenticated;
grant execute on function public.aligned_discovery_tiles(text, integer) to authenticated;

create or replace function public.get_aligned_tile_contact_details(p_tile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
  v_tile public.aligned_tiles%rowtype;
  v_owner public.members%rowtype;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  if not public.is_active_member() then
    return jsonb_build_object('success', false, 'error', 'Active membership required');
  end if;

  select *
  into v_tile
  from public.aligned_tiles
  where id = p_tile_id
    and is_active = true
    and moderation_status = 'approved'
    and type = 'project'
    and coalesce(contact_enabled, false) = true;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Project contact is not available');
  end if;

  if v_tile.user_id = v_actor then
    return jsonb_build_object('success', false, 'error', 'Cannot contact your own project');
  end if;

  if not (public.get_member_tier() = any(v_tile.visibility_tiers)) then
    return jsonb_build_object('success', false, 'error', 'Project is not available to your membership');
  end if;

  select *
  into v_owner
  from public.members
  where id = v_tile.user_id
    and status = 'active';

  if not found or v_owner.email is null or btrim(v_owner.email) = '' then
    return jsonb_build_object('success', false, 'error', 'Project owner email is unavailable');
  end if;

  return jsonb_build_object(
    'success', true,
    'email', v_owner.email,
    'full_name', v_owner.full_name,
    'subject', 'AMARI project enquiry',
    'tile_description', v_tile.description
  );
end;
$fn$;

revoke execute on function public.get_aligned_tile_contact_details(uuid) from public, anon, authenticated;
grant execute on function public.get_aligned_tile_contact_details(uuid) to authenticated;

commit;
