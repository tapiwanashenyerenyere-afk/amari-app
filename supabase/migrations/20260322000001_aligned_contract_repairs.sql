begin;

-- Keep the legacy weekly-match RPC callable by clients that omit p_member_id.
create or replace function public.aligned_decide(
  p_match_id bigint,
  p_member_id uuid default null,
  p_decision text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
  v_match public.aligned_matches%rowtype;
  v_is_a boolean;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  if p_member_id is not null and p_member_id <> v_actor then
    return jsonb_build_object('success', false, 'error', 'Cannot decide on behalf of another member');
  end if;

  if p_decision is null or p_decision not in ('accept', 'pass') then
    return jsonb_build_object('success', false, 'error', 'Invalid decision');
  end if;

  select * into v_match
  from public.aligned_matches
  where id = p_match_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Match not found');
  end if;

  if v_match.stage not in ('new', 'accepted') then
    return jsonb_build_object('success', false, 'error', 'Match already resolved');
  end if;

  v_is_a := v_actor = v_match.member_a;
  if not v_is_a and v_actor <> v_match.member_b then
    return jsonb_build_object('success', false, 'error', 'Not your match');
  end if;

  if v_is_a then
    update public.aligned_matches
    set a_decision = p_decision
    where id = p_match_id;
  else
    update public.aligned_matches
    set b_decision = p_decision
    where id = p_match_id;
  end if;

  select * into v_match
  from public.aligned_matches
  where id = p_match_id;

  if p_decision = 'pass' then
    update public.aligned_matches
    set stage = 'declined'
    where id = p_match_id;

    return jsonb_build_object('success', true, 'stage', 'declined');
  end if;

  if v_match.a_decision = 'accept' and v_match.b_decision = 'accept' then
    update public.aligned_matches
    set stage = 'revealed'
    where id = p_match_id;

    return jsonb_build_object('success', true, 'stage', 'revealed');
  end if;

  update public.aligned_matches
  set stage = 'accepted'
  where id = p_match_id;

  return jsonb_build_object('success', true, 'stage', 'accepted');
end;
$fn$;

revoke execute on function public.aligned_decide(bigint, uuid, text) from public, anon, authenticated;
grant execute on function public.aligned_decide(bigint, uuid, text) to authenticated;

create unique index if not exists idx_connections_unique_pair
  on public.connections ((least(user_a, user_b)), (greatest(user_a, user_b)));

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
    t.created_at
  from public.aligned_tiles t
  join public.members m
    on m.id = t.user_id
   and m.status = 'active'
  where auth.uid() is not null
    and public.is_active_member()
    and public.tier_level(public.get_member_tier()) >= public.tier_level('platinum'::membership_tier)
    and t.is_active = true
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

create or replace function public.aligned_express_interest(p_tile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
  v_target_tile public.aligned_tiles%rowtype;
  v_reverse_interest public.aligned_interests%rowtype;
  v_other_member public.members%rowtype;
  v_inserted_interest uuid;
  v_connection_id uuid;
  v_already_expressed boolean := false;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  if not public.is_active_member() then
    return jsonb_build_object('success', false, 'error', 'Active membership required');
  end if;

  if public.tier_level(public.get_member_tier()) < public.tier_level('platinum'::membership_tier) then
    return jsonb_build_object('success', false, 'error', 'Aligned is available to Platinum members and above');
  end if;

  select * into v_target_tile
  from public.aligned_tiles
  where id = p_tile_id
    and is_active = true;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Tile not found');
  end if;

  if v_target_tile.user_id = v_actor then
    return jsonb_build_object('success', false, 'error', 'Cannot align with your own tile');
  end if;

  insert into public.aligned_interests (from_user_id, to_tile_id)
  values (v_actor, p_tile_id)
  on conflict (from_user_id, to_tile_id) do nothing
  returning id into v_inserted_interest;

  v_already_expressed := v_inserted_interest is null;

  select i.* into v_reverse_interest
  from public.aligned_interests i
  join public.aligned_tiles actor_tile
    on actor_tile.id = i.to_tile_id
  where i.from_user_id = v_target_tile.user_id
    and actor_tile.user_id = v_actor
    and actor_tile.is_active = true
  order by i.expressed_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', true,
      'already_expressed', v_already_expressed,
      'mutual', false
    );
  end if;

  select id into v_connection_id
  from public.connections
  where (user_a = v_actor and user_b = v_target_tile.user_id)
     or (user_a = v_target_tile.user_id and user_b = v_actor)
  limit 1;

  if v_connection_id is null then
    insert into public.connections (
      user_a,
      user_b,
      matched_via,
      tile_a_id,
      tile_b_id,
      status
    )
    values (
      v_actor,
      v_target_tile.user_id,
      v_target_tile.type,
      v_reverse_interest.to_tile_id,
      p_tile_id,
      'mutual'
    )
    returning id into v_connection_id;
  end if;

  select * into v_other_member
  from public.members
  where id = v_target_tile.user_id
    and status = 'active';

  return jsonb_build_object(
    'success', true,
    'already_expressed', v_already_expressed,
    'mutual', true,
    'connection_id', v_connection_id,
    'revealed_member', jsonb_build_object(
      'id', v_other_member.id,
      'full_name', v_other_member.full_name,
      'title', v_other_member.title,
      'company', v_other_member.company,
      'city', v_other_member.city,
      'photo_url', v_other_member.photo_url,
      'tier', v_other_member.tier::text
    )
  );
end;
$fn$;

revoke execute on function public.aligned_express_interest(uuid) from public, anon, authenticated;
grant execute on function public.aligned_express_interest(uuid) to authenticated;

create or replace function public.get_aligned_connections(p_limit integer default 6)
returns table (
  id uuid,
  connected_at timestamptz,
  matched_via text,
  other_member_id uuid,
  full_name text,
  title text,
  company text,
  city text,
  photo_url text,
  tier membership_tier
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    c.id,
    c.connected_at,
    c.matched_via,
    case when c.user_a = auth.uid() then member_b.id else member_a.id end as other_member_id,
    case when c.user_a = auth.uid() then member_b.full_name else member_a.full_name end as full_name,
    case when c.user_a = auth.uid() then member_b.title else member_a.title end as title,
    case when c.user_a = auth.uid() then member_b.company else member_a.company end as company,
    case when c.user_a = auth.uid() then member_b.city else member_a.city end as city,
    case when c.user_a = auth.uid() then member_b.photo_url else member_a.photo_url end as photo_url,
    case when c.user_a = auth.uid() then member_b.tier else member_a.tier end as tier
  from public.connections c
  join public.members member_a
    on member_a.id = c.user_a
   and member_a.status = 'active'
  join public.members member_b
    on member_b.id = c.user_b
   and member_b.status = 'active'
  where auth.uid() is not null
    and public.is_active_member()
    and (c.user_a = auth.uid() or c.user_b = auth.uid())
  order by c.connected_at desc
  limit greatest(coalesce(p_limit, 6), 1);
$fn$;

revoke execute on function public.get_aligned_connections(integer) from public, anon, authenticated;
grant execute on function public.get_aligned_connections(integer) to authenticated;

commit;
