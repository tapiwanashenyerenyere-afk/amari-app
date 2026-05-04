begin;

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- ADMIN ROLES: owner support + JWT role metadata
-- ============================================================
alter table public.admin_roles
  drop constraint if exists admin_roles_role_check;

alter table public.admin_roles
  add constraint admin_roles_role_check
  check (role in ('owner', 'admin', 'editor', 'door_staff'));

create or replace function public.get_admin_role(p_member_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select role
  from public.admin_roles
  where member_id = coalesce(p_member_id, auth.uid())
  limit 1;
$fn$;

revoke execute on function public.get_admin_role(uuid) from public, anon;
grant execute on function public.get_admin_role(uuid) to authenticated;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $fn$
declare
  claims jsonb;
  v_tier text;
  v_admin_role text;
  v_user_id uuid;
begin
  v_user_id := (event ->> 'user_id')::uuid;
  claims := event -> 'claims';

  select tier::text
  into v_tier
  from public.members
  where id = v_user_id
    and status = 'active';

  select role
  into v_admin_role
  from public.admin_roles
  where member_id = v_user_id
  limit 1;

  claims := jsonb_set(
    claims,
    '{app_metadata}',
    coalesce(claims -> 'app_metadata', '{}'::jsonb) ||
    jsonb_build_object(
      'tier', coalesce(v_tier, 'member'),
      'is_admin', coalesce(v_admin_role is not null, false),
      'admin_role', v_admin_role
    )
  );

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$fn$;

-- ============================================================
-- INVITATION CODES: owner/admin grants + monthly member invites
-- ============================================================
alter table public.invitation_codes
  add column if not exists staff_role_grant text,
  add column if not exists invite_source text not null default 'bootstrap',
  add column if not exists issued_by uuid references public.members(id),
  add column if not exists issued_at timestamptz,
  add column if not exists issued_month date,
  add column if not exists recipient_name text,
  add column if not exists recipient_email text;

update public.invitation_codes
set invite_source = 'bootstrap'
where invite_source is null;

do $chk$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'invitation_codes_staff_role_grant_check'
      and conrelid = 'public.invitation_codes'::regclass
  ) then
    alter table public.invitation_codes
      add constraint invitation_codes_staff_role_grant_check
      check (staff_role_grant is null or staff_role_grant in ('owner', 'admin', 'editor', 'door_staff'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'invitation_codes_invite_source_check'
      and conrelid = 'public.invitation_codes'::regclass
  ) then
    alter table public.invitation_codes
      add constraint invitation_codes_invite_source_check
      check (invite_source in ('bootstrap', 'monthly_member'));
  end if;
end;
$chk$;

create index if not exists idx_invitation_codes_issued_by_month
  on public.invitation_codes(issued_by, issued_month);

create index if not exists idx_invitation_codes_recipient_email
  on public.invitation_codes(lower(recipient_email))
  where recipient_email is not null;

create table if not exists public.member_monthly_invites (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  month_key date not null,
  quota_total integer not null default 3 check (quota_total between 0 and 3),
  quota_used integer not null default 0 check (quota_used >= 0 and quota_used <= quota_total),
  announcement_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, month_key)
);

alter table public.member_monthly_invites enable row level security;

drop policy if exists "member_monthly_invites_select_own" on public.member_monthly_invites;
drop policy if exists "member_monthly_invites_admin_all" on public.member_monthly_invites;

create policy "member_monthly_invites_select_own"
  on public.member_monthly_invites
  for select
  to authenticated
  using (member_id = auth.uid());

create policy "member_monthly_invites_admin_all"
  on public.member_monthly_invites
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.current_invite_month_key()
returns date
language sql
stable
as $fn$
  select date_trunc('month', timezone('Australia/Sydney', now()))::date;
$fn$;

create or replace function public.current_invite_month_expires_at()
returns timestamptz
language sql
stable
as $fn$
  select ((date_trunc('month', timezone('Australia/Sydney', now())) + interval '1 month') at time zone 'Australia/Sydney') - interval '1 second';
$fn$;

create or replace function public.generate_share_invite_code(p_prefix text default 'AMARI-INV')
returns text
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_candidate text;
begin
  loop
    v_candidate := upper(coalesce(p_prefix, 'AMARI-INV')) || '-' || substring(encode(extensions.gen_random_bytes(4), 'hex') from 1 for 8);
    exit when not exists (
      select 1
      from public.invitation_codes
      where code = v_candidate
    );
  end loop;

  return v_candidate;
end;
$fn$;

revoke execute on function public.generate_share_invite_code(text) from public, anon, authenticated;

create or replace function public.get_monthly_invite_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
  v_member public.members%rowtype;
  v_month date := public.current_invite_month_key();
  v_quota public.member_monthly_invites%rowtype;
  v_invites jsonb := '[]'::jsonb;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select *
  into v_member
  from public.members
  where id = v_actor
    and status = 'active';

  if not found then
    return jsonb_build_object('success', false, 'error', 'Member not found or inactive');
  end if;

  if v_member.tier not in ('platinum', 'laureate') then
    return jsonb_build_object(
      'success', true,
      'eligible', false,
      'tier', v_member.tier::text,
      'quota_total', 0,
      'quota_used', 0,
      'remaining', 0,
      'month_key', v_month::text,
      'should_show_announcement', false,
      'allowed_tiers', jsonb_build_array(),
      'invites', '[]'::jsonb
    );
  end if;

  insert into public.member_monthly_invites (member_id, month_key, quota_total, quota_used)
  values (v_actor, v_month, 3, 0)
  on conflict (member_id, month_key) do nothing;

  select *
  into v_quota
  from public.member_monthly_invites
  where member_id = v_actor
    and month_key = v_month;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'code', code,
        'code_prefix', code_prefix,
        'recipient_name', recipient_name,
        'recipient_email', recipient_email,
        'tier_grant', tier_grant::text,
        'issued_at', issued_at,
        'used_at', used_at
      )
      order by issued_at desc nulls last
    ),
    '[]'::jsonb
  )
  into v_invites
  from (
    select id, code, code_prefix, recipient_name, recipient_email, tier_grant, issued_at, used_at
    from public.invitation_codes
    where issued_by = v_actor
      and invite_source = 'monthly_member'
      and issued_month = v_month
    order by issued_at desc nulls last
    limit 20
  ) sent_codes;

  return jsonb_build_object(
    'success', true,
    'eligible', true,
    'tier', v_member.tier::text,
    'quota_total', v_quota.quota_total,
    'quota_used', v_quota.quota_used,
    'remaining', greatest(v_quota.quota_total - v_quota.quota_used, 0),
    'month_key', v_month::text,
    'should_show_announcement', v_quota.announcement_seen_at is null,
    'allowed_tiers', jsonb_build_array('member', 'silver', 'platinum'),
    'invites', v_invites
  );
end;
$fn$;

create or replace function public.acknowledge_monthly_invite_announcement()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
  v_member public.members%rowtype;
  v_month date := public.current_invite_month_key();
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select *
  into v_member
  from public.members
  where id = v_actor
    and status = 'active';

  if not found then
    return jsonb_build_object('success', false, 'error', 'Member not found or inactive');
  end if;

  if v_member.tier not in ('platinum', 'laureate') then
    return jsonb_build_object('success', true, 'eligible', false);
  end if;

  insert into public.member_monthly_invites (member_id, month_key, quota_total, quota_used, announcement_seen_at)
  values (v_actor, v_month, 3, 0, now())
  on conflict (member_id, month_key)
  do update
    set announcement_seen_at = coalesce(public.member_monthly_invites.announcement_seen_at, excluded.announcement_seen_at),
        updated_at = now();

  return jsonb_build_object('success', true, 'eligible', true);
end;
$fn$;

create or replace function public.create_monthly_invite(
  p_recipient_name text,
  p_recipient_email text,
  p_tier membership_tier
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_actor uuid := auth.uid();
  v_member public.members%rowtype;
  v_month date := public.current_invite_month_key();
  v_quota public.member_monthly_invites%rowtype;
  v_code text;
  v_email text;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  if p_recipient_name is null or btrim(p_recipient_name) = '' then
    return jsonb_build_object('success', false, 'error', 'Recipient name is required');
  end if;

  if p_recipient_email is null or btrim(p_recipient_email) = '' then
    return jsonb_build_object('success', false, 'error', 'Recipient email is required');
  end if;

  if p_tier not in ('member', 'silver', 'platinum') then
    return jsonb_build_object('success', false, 'error', 'Invalid invite tier');
  end if;

  select *
  into v_member
  from public.members
  where id = v_actor
    and status = 'active';

  if not found then
    return jsonb_build_object('success', false, 'error', 'Member not found or inactive');
  end if;

  if v_member.tier not in ('platinum', 'laureate') then
    return jsonb_build_object('success', false, 'error', 'Invite privileges require Platinum or Laureate');
  end if;

  insert into public.member_monthly_invites (member_id, month_key, quota_total, quota_used)
  values (v_actor, v_month, 3, 0)
  on conflict (member_id, month_key) do nothing;

  select *
  into v_quota
  from public.member_monthly_invites
  where member_id = v_actor
    and month_key = v_month
  for update;

  if v_quota.quota_used >= v_quota.quota_total then
    return jsonb_build_object('success', false, 'error', 'No invites remaining this month');
  end if;

  v_code := public.generate_share_invite_code('AMARI-INV');
  v_email := lower(btrim(p_recipient_email));

  insert into public.invitation_codes (
    code,
    code_hash,
    code_prefix,
    created_by,
    issued_by,
    issued_at,
    issued_month,
    invite_source,
    recipient_name,
    recipient_email,
    tier_grant,
    grants_admin,
    staff_role_grant,
    expires_at
  )
  values (
    v_code,
    encode(extensions.digest(v_code, 'sha256'), 'hex'),
    substring(v_code, 1, 10),
    v_actor,
    v_actor,
    now(),
    v_month,
    'monthly_member',
    btrim(p_recipient_name),
    v_email,
    p_tier,
    false,
    null,
    public.current_invite_month_expires_at()
  );

  update public.member_monthly_invites
  set quota_used = quota_used + 1,
      updated_at = now()
  where id = v_quota.id;

  return jsonb_build_object(
    'success', true,
    'code', v_code,
    'recipient_name', btrim(p_recipient_name),
    'recipient_email', v_email,
    'tier_grant', p_tier::text,
    'remaining', greatest(v_quota.quota_total - (v_quota.quota_used + 1), 0)
  );
end;
$fn$;

revoke execute on function public.get_monthly_invite_status() from public, anon;
revoke execute on function public.acknowledge_monthly_invite_announcement() from public, anon;
revoke execute on function public.create_monthly_invite(text, text, membership_tier) from public, anon;
grant execute on function public.get_monthly_invite_status() to authenticated;
grant execute on function public.acknowledge_monthly_invite_announcement() to authenticated;
grant execute on function public.create_monthly_invite(text, text, membership_tier) to authenticated;

create or replace function public.redeem_invitation_code(
  p_code text,
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_city text default null,
  p_industry text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_invite public.invitation_codes%rowtype;
  v_member_exists boolean;
  v_hash text;
  v_is_staff boolean;
  v_admin_role text;
  v_normalized_email text;
begin
  select exists (
    select 1
    from public.members
    where id = p_user_id
  )
  into v_member_exists;

  if v_member_exists then
    return jsonb_build_object(
      'success', false,
      'error', 'already_member'
    );
  end if;

  v_hash := encode(extensions.digest(upper(p_code), 'sha256'), 'hex');

  select *
  into v_invite
  from public.invitation_codes
  where code_hash = v_hash
    and used_by is null
    and expires_at > now()
  for update skip locked;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'invalid_or_expired'
    );
  end if;

  v_normalized_email := lower(btrim(p_email));
  if v_invite.recipient_email is not null
     and lower(btrim(v_invite.recipient_email)) <> v_normalized_email then
    return jsonb_build_object(
      'success', false,
      'error', 'email_mismatch'
    );
  end if;

  update public.invitation_codes
  set used_by = p_user_id,
      used_at = now()
  where id = v_invite.id;

  insert into public.members (id, full_name, email, tier, status, city, industry)
  values (
    p_user_id,
    p_full_name,
    p_email,
    v_invite.tier_grant,
    'active',
    p_city,
    p_industry
  );

  v_admin_role := coalesce(v_invite.staff_role_grant, case when v_invite.grants_admin then 'admin' else null end);
  v_is_staff := v_admin_role is not null;

  if v_is_staff then
    insert into public.admin_roles (member_id, role)
    values (p_user_id, v_admin_role)
    on conflict (member_id) do update
      set role = excluded.role;
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'tier', v_invite.tier_grant::text,
      'is_admin', v_is_staff,
      'admin_role', v_admin_role
    )
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'tier', v_invite.tier_grant::text,
    'is_admin', v_is_staff,
    'admin_role', v_admin_role
  );
end;
$fn$;

grant execute on function public.redeem_invitation_code(text, uuid, text, text, text, text) to authenticated;

-- ============================================================
-- CORRIDOR: Silver+ sees and acts on all active opportunities
-- ============================================================
drop policy if exists "corridor_select" on public.corridor_opportunities;

create policy "corridor_select"
  on public.corridor_opportunities
  for select
  to authenticated
  using (
    is_active = true
    and public.is_active_member()
    and public.tier_level(public.get_member_tier()) >= public.tier_level('silver'::membership_tier)
  );

drop policy if exists "corridor_interests_insert_checked" on public.corridor_interests;

create policy "corridor_interests_insert_checked"
  on public.corridor_interests
  for insert
  to authenticated
  with check (
    member_id = auth.uid()
    and public.is_active_member()
    and public.tier_level(public.get_member_tier()) >= public.tier_level('silver'::membership_tier)
    and exists (
      select 1
      from public.corridor_opportunities co
      where co.id = opportunity_id
        and co.is_active = true
        and (co.closing_date is null or co.closing_date >= current_date)
    )
  );

-- ============================================================
-- ALIGNED: member access, visibility tiers, moderation
-- ============================================================
alter table public.aligned_tiles
  add column if not exists visibility_tiers membership_tier[] not null default array['platinum'::membership_tier, 'laureate'::membership_tier],
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references public.members(id),
  add column if not exists rejected_reason text;

do $chk$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'aligned_tiles_moderation_status_check'
      and conrelid = 'public.aligned_tiles'::regclass
  ) then
    alter table public.aligned_tiles
      add constraint aligned_tiles_moderation_status_check
      check (moderation_status in ('pending', 'approved', 'rejected'));
  end if;
end;
$chk$;

update public.aligned_tiles
set visibility_tiers = array['platinum'::membership_tier, 'laureate'::membership_tier]
where visibility_tiers is null;

update public.aligned_tiles
set moderation_status = coalesce(moderation_status, 'approved'),
    moderated_at = coalesce(moderated_at, created_at, now())
where moderation_status is null
   or moderated_at is null;

create or replace function public.apply_aligned_tile_submission_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor_tier membership_tier;
begin
  select tier
  into v_actor_tier
  from public.members
  where id = new.user_id
    and status = 'active';

  if new.visibility_tiers is null or cardinality(new.visibility_tiers) = 0 then
    new.visibility_tiers := array['platinum'::membership_tier, 'laureate'::membership_tier];
  end if;

  if v_actor_tier in ('platinum', 'laureate') then
    new.moderation_status := 'approved';
    new.moderated_at := coalesce(new.moderated_at, now());
    new.moderated_by := coalesce(new.moderated_by, new.user_id);
    new.rejected_reason := null;
  else
    new.moderation_status := 'pending';
    new.moderated_at := null;
    new.moderated_by := null;
    new.rejected_reason := null;
  end if;

  return new;
end;
$fn$;

drop trigger if exists tr_apply_aligned_tile_submission_defaults on public.aligned_tiles;
create trigger tr_apply_aligned_tile_submission_defaults
  before insert on public.aligned_tiles
  for each row
  execute function public.apply_aligned_tile_submission_defaults();

drop policy if exists "aligned_tiles_own_crud" on public.aligned_tiles;
drop policy if exists "aligned_tiles_discovery" on public.aligned_tiles;
drop policy if exists "aligned_tiles_admin_all" on public.aligned_tiles;

create policy "aligned_tiles_own_crud"
  on public.aligned_tiles
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.is_active_member()
    and public.tier_level(public.get_member_tier()) >= public.tier_level('silver'::membership_tier)
  );

create policy "aligned_tiles_discovery"
  on public.aligned_tiles
  for select
  to authenticated
  using (
    is_active = true
    and moderation_status = 'approved'
    and user_id <> auth.uid()
    and public.is_active_member()
    and public.get_member_tier() = any(visibility_tiers)
  );

create policy "aligned_tiles_admin_all"
  on public.aligned_tiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "aligned_interests_insert" on public.aligned_interests;

create policy "aligned_interests_insert"
  on public.aligned_interests
  for insert
  to authenticated
  with check (
    from_user_id = auth.uid()
    and public.is_active_member()
    and exists (
      select 1
      from public.aligned_tiles t
      where t.id = to_tile_id
        and t.is_active = true
        and t.moderation_status = 'approved'
        and t.user_id <> auth.uid()
        and public.get_member_tier() = any(t.visibility_tiers)
    )
  );

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

  select *
  into v_target_tile
  from public.aligned_tiles
  where id = p_tile_id
    and is_active = true
    and moderation_status = 'approved';

  if not found then
    return jsonb_build_object('success', false, 'error', 'Tile not found');
  end if;

  if not (public.get_member_tier() = any(v_target_tile.visibility_tiers)) then
    return jsonb_build_object('success', false, 'error', 'Tile is not available to your membership');
  end if;

  if v_target_tile.user_id = v_actor then
    return jsonb_build_object('success', false, 'error', 'Cannot align with your own tile');
  end if;

  insert into public.aligned_interests (from_user_id, to_tile_id)
  values (v_actor, p_tile_id)
  on conflict (from_user_id, to_tile_id) do nothing
  returning id into v_inserted_interest;

  v_already_expressed := v_inserted_interest is null;

  select i.*
  into v_reverse_interest
  from public.aligned_interests i
  join public.aligned_tiles actor_tile
    on actor_tile.id = i.to_tile_id
  where i.from_user_id = v_target_tile.user_id
    and actor_tile.user_id = v_actor
    and actor_tile.is_active = true
    and actor_tile.moderation_status = 'approved'
  order by i.expressed_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', true,
      'already_expressed', v_already_expressed,
      'mutual', false
    );
  end if;

  select id
  into v_connection_id
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

  select *
  into v_other_member
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

create or replace function public.review_aligned_tile(
  p_tile_id uuid,
  p_decision text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  if p_decision not in ('approve', 'reject') then
    return jsonb_build_object('success', false, 'error', 'Invalid decision');
  end if;

  update public.aligned_tiles
  set moderation_status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
      moderated_at = now(),
      moderated_by = v_actor,
      rejected_reason = case when p_decision = 'reject' then nullif(btrim(p_reason), '') else null end
  where id = p_tile_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Tile not found');
  end if;

  return jsonb_build_object(
    'success', true,
    'status', case when p_decision = 'approve' then 'approved' else 'rejected' end
  );
end;
$fn$;

revoke execute on function public.review_aligned_tile(uuid, text, text) from public, anon;
grant execute on function public.review_aligned_tile(uuid, text, text) to authenticated;

-- ============================================================
-- BOOTSTRAP CODE POOL RESET
-- ============================================================
update public.invitation_codes
set expires_at = now()
where used_by is null
  and invite_source = 'bootstrap';

insert into public.invitation_codes (
  code,
  code_hash,
  code_prefix,
  tier_grant,
  grants_admin,
  staff_role_grant,
  invite_source,
  expires_at
)
select
  code_value,
  encode(extensions.digest(code_value, 'sha256'), 'hex'),
  substring(code_value, 1, 10),
  granted_tier,
  grants_admin,
  staff_role,
  'bootstrap',
  now() + interval '1 year'
from (
  select
    'AMARI-OWNR-' || lpad(n::text, 3, '0') as code_value,
    'laureate'::membership_tier as granted_tier,
    true as grants_admin,
    'owner'::text as staff_role
  from generate_series(1, 3) as n

  union all

  select
    'AMARI-ADMN-' || lpad(n::text, 3, '0'),
    'laureate'::membership_tier,
    true,
    'admin'::text
  from generate_series(1, 9) as n

  union all

  select
    'AMARI-LAUR-' || lpad(n::text, 3, '0'),
    'laureate'::membership_tier,
    false,
    null::text
  from generate_series(1, 50) as n

  union all

  select
    'AMARI-PLAT-' || lpad(n::text, 3, '0'),
    'platinum'::membership_tier,
    false,
    null::text
  from generate_series(1, 200) as n

  union all

  select
    'AMARI-SLVR-' || lpad(n::text, 3, '0'),
    'silver'::membership_tier,
    false,
    null::text
  from generate_series(1, 350) as n

  union all

  select
    'AMARI-MEMB-' || lpad(n::text, 3, '0'),
    'member'::membership_tier,
    false,
    null::text
  from generate_series(1, 600) as n
) bootstrap_codes
on conflict (code) do nothing;

commit;
