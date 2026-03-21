-- 20260321000003_authority_hardening_v2.sql
-- Forward repair for authority boundaries, schema drift, RPC hardening, and storage policy correctness.
-- Validated against actual policy names from 20260301000001_rls_policies.sql

begin;

-- 0. Harden helper functions
create or replace function public.get_member_tier()
returns membership_tier language plpgsql stable security definer set search_path = public as $fn$
declare v_tier membership_tier;
begin
  begin
    v_tier := (auth.jwt() -> 'app_metadata' ->> 'tier')::membership_tier;
    if v_tier is not null then return v_tier; end if;
  exception when others then null;
  end;
  select tier into v_tier from public.members where id = auth.uid() and status = 'active';
  return coalesce(v_tier, 'member'::membership_tier);
end; $fn$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.members where id = auth.uid() and status = 'active');
$fn$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.admin_roles where member_id = auth.uid());
$fn$;

-- 1. Members hardening
alter table public.members enable row level security;

drop policy if exists "members_own_profile_select" on public.members;
drop policy if exists "members_own_profile_update" on public.members;
drop policy if exists "members_directory_select" on public.members;
drop policy if exists "members_admin_all" on public.members;
drop policy if exists "members_insert" on public.members;
drop policy if exists "members_self_read" on public.members;
drop policy if exists "members_self_profile_update" on public.members;
drop policy if exists "members_directory_read" on public.members;

create policy "members_self_read" on public.members for select to authenticated using (id = auth.uid());
create policy "members_self_profile_update" on public.members for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "members_admin_all" on public.members for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke insert on public.members from anon, authenticated;
revoke update on public.members from anon, authenticated;
grant update (full_name, photo_url, bio, industry, city, company, title, skills, interests, current_project, notification_preferences, expo_push_token) on public.members to authenticated;

create or replace function public.prevent_privileged_member_field_updates()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if auth.role() = 'service_role' or public.is_admin() then return new; end if;
  if new.tier is distinct from old.tier or new.status is distinct from old.status or new.display_id is distinct from old.display_id or new.invited_by is distinct from old.invited_by or new.consent_given_at is distinct from old.consent_given_at or new.consent_version is distinct from old.consent_version then
    raise exception 'Privileged member fields may not be updated directly';
  end if;
  return new;
end; $fn$;

drop trigger if exists tr_prevent_privileged_member_field_updates on public.members;
create trigger tr_prevent_privileged_member_field_updates before update on public.members for each row execute function public.prevent_privileged_member_field_updates();

-- 2. Display ID repair
drop trigger if exists set_display_id on public.members;
do $chk$ begin
  if not exists (select 1 from pg_trigger where tgname = 'tr_member_display_id' and tgrelid = 'public.members'::regclass) then
    create trigger tr_member_display_id before insert on public.members for each row execute function public.set_member_display_id();
  end if;
end; $chk$;

-- 3. Corridor schema repair
alter table public.corridor_interests add column if not exists status text default 'pending', add column if not exists expressed_at timestamptz default now(), add column if not exists reviewed_at timestamptz;

do $chk$ begin
  if not exists (select 1 from pg_constraint where conname = 'corridor_interests_status_check' and conrelid = 'public.corridor_interests'::regclass) then
    alter table public.corridor_interests add constraint corridor_interests_status_check check (status in ('pending', 'reviewed', 'accepted', 'declined'));
  end if;
end; $chk$;

update public.corridor_interests set expressed_at = created_at where expressed_at is null and created_at is not null;
update public.corridor_interests set status = 'pending' where status is null;
create index if not exists idx_corridor_interests_member_id on public.corridor_interests(member_id);

drop policy if exists "corridor_interests_own" on public.corridor_interests;
drop policy if exists "corridor_interests_admin" on public.corridor_interests;
drop policy if exists "Members can view own interests" on public.corridor_interests;
drop policy if exists "Members can insert own interests" on public.corridor_interests;
drop policy if exists "corridor_interests_select_own" on public.corridor_interests;
drop policy if exists "corridor_interests_insert_checked" on public.corridor_interests;
drop policy if exists "corridor_interests_admin_all" on public.corridor_interests;

create policy "corridor_interests_select_own" on public.corridor_interests for select to authenticated using (member_id = auth.uid());
create policy "corridor_interests_insert_checked" on public.corridor_interests for insert to authenticated with check (member_id = auth.uid() and public.is_active_member() and exists (select 1 from public.corridor_opportunities co where co.id = opportunity_id and co.is_active = true and (co.closing_date is null or co.closing_date >= current_date) and public.tier_level(public.get_member_tier()) >= public.tier_level(co.min_tier)));
create policy "corridor_interests_admin_all" on public.corridor_interests for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. RSVP RPC hardening (preserves FOR UPDATE, tier, access-window checks)
create or replace function public.rsvp_to_event(p_event_id bigint, p_member_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); v_event public.events%rowtype; v_member public.members%rowtype; v_current_count int; v_status rsvp_status;
begin
  if v_actor is null then return jsonb_build_object('success', false, 'error', 'Not authenticated'); end if;
  if p_member_id is not null and p_member_id <> v_actor then return jsonb_build_object('success', false, 'error', 'Cannot RSVP on behalf of another member'); end if;
  select * into v_event from public.events where id = p_event_id for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Event not found'); end if;
  select * into v_member from public.members where id = v_actor and status = 'active';
  if not found then return jsonb_build_object('success', false, 'error', 'Member not found or inactive'); end if;
  if public.tier_level(v_member.tier) < public.tier_level(v_event.min_tier) then return jsonb_build_object('success', false, 'error', 'Tier too low for this event'); end if;
  if v_event.early_access_at is not null and now() < v_event.early_access_at then return jsonb_build_object('success', false, 'error', 'RSVPs not yet open'); end if;
  if v_event.general_access_at is not null and now() < v_event.general_access_at and public.tier_level(v_member.tier) < 3 then return jsonb_build_object('success', false, 'error', 'Early access for Platinum+ only'); end if;
  if exists (select 1 from public.event_rsvps where event_id = p_event_id and member_id = v_actor) then return jsonb_build_object('success', false, 'error', 'Already RSVPd'); end if;
  if v_event.capacity is not null then
    select count(*) into v_current_count from public.event_rsvps where event_id = p_event_id and status = 'confirmed';
    if v_current_count >= v_event.capacity then v_status := 'waitlisted'; else v_status := 'confirmed'; end if;
  else v_status := 'confirmed'; end if;
  insert into public.event_rsvps (event_id, member_id, status) values (p_event_id, v_actor, v_status);
  return jsonb_build_object('success', true, 'status', v_status::text, 'event_title', v_event.title);
end; $fn$;

revoke execute on function public.rsvp_to_event(bigint, uuid) from public, anon, authenticated;
grant execute on function public.rsvp_to_event(bigint, uuid) to authenticated;

-- 5. Barcode lockdown
drop policy if exists "barcode_seeds_service" on public.barcode_seeds;
drop policy if exists "barcode_seeds_read" on public.barcode_seeds;
alter table public.barcode_seeds enable row level security;
revoke all on public.barcode_seeds from anon, authenticated;

create or replace function public.ensure_daily_seed()
returns text language plpgsql security definer set search_path = public, extensions as $fn$
declare v_seed text;
begin
  insert into public.barcode_seeds (date_bucket) values (current_date) on conflict (date_bucket) do nothing;
  select seed into v_seed from public.barcode_seeds where date_bucket = current_date;
  return v_seed;
end; $fn$;

create or replace function public.generate_barcode_token(p_member_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $fn$
declare v_actor uuid := auth.uid(); v_seed text; v_hmac text; v_token text;
begin
  if v_actor is null then return jsonb_build_object('success', false, 'error', 'Not authenticated'); end if;
  if p_member_id is not null and p_member_id <> v_actor then return jsonb_build_object('success', false, 'error', 'Cannot generate barcode for another member'); end if;
  v_seed := public.ensure_daily_seed();
  v_hmac := left(encode(extensions.hmac(v_actor::text || ':' || current_date::text, v_seed, 'sha256'), 'hex'), 16);
  v_token := v_actor::text || ':' || current_date::text || ':' || v_hmac;
  return jsonb_build_object('token', v_token, 'expires_at', (current_date + interval '1 day 4 hours')::text);
end; $fn$;

create or replace function public.verify_barcode(p_token text, p_event_id bigint default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $fn$
declare v_parts text[]; v_member_id uuid; v_date_bucket date; v_provided_hmac text; v_expected_hmac text; v_seed text; v_member public.members%rowtype; v_rsvp public.event_rsvps%rowtype; v_revoked boolean;
begin
  if auth.uid() is null or not public.is_admin() then return jsonb_build_object('valid', false, 'error', 'Not authorized'); end if;
  v_parts := string_to_array(p_token, ':');
  if array_length(v_parts, 1) <> 3 then return jsonb_build_object('valid', false, 'error', 'Invalid token format'); end if;
  v_member_id := v_parts[1]::uuid; v_date_bucket := v_parts[2]::date; v_provided_hmac := v_parts[3];
  if v_date_bucket < current_date - interval '4 hours' then return jsonb_build_object('valid', false, 'error', 'Token expired'); end if;
  select seed into v_seed from public.barcode_seeds where date_bucket = v_date_bucket;
  if v_seed is null then return jsonb_build_object('valid', false, 'error', 'Invalid date bucket'); end if;
  v_expected_hmac := encode(extensions.hmac(v_member_id::text || ':' || v_date_bucket::text, v_seed, 'sha256'), 'hex');
  if left(v_expected_hmac, 16) <> v_provided_hmac then return jsonb_build_object('valid', false, 'error', 'Invalid signature'); end if;
  select exists (select 1 from public.barcode_revocations where member_id = v_member_id) into v_revoked;
  if v_revoked then return jsonb_build_object('valid', false, 'error', 'Barcode revoked'); end if;
  select * into v_member from public.members where id = v_member_id and status = 'active';
  if not found then return jsonb_build_object('valid', false, 'error', 'Member not found or inactive'); end if;
  if p_event_id is not null then
    select * into v_rsvp from public.event_rsvps where event_id = p_event_id and member_id = v_member_id;
    if not found then return jsonb_build_object('valid', true, 'rsvp', false, 'name', v_member.full_name, 'tier', v_member.tier::text, 'display_id', v_member.display_id, 'warning', 'No RSVP for this event'); end if;
    if v_rsvp.checked_in_at is not null then return jsonb_build_object('valid', true, 'rsvp', true, 'already_checked_in', true, 'checked_in_at', v_rsvp.checked_in_at, 'name', v_member.full_name, 'tier', v_member.tier::text, 'display_id', v_member.display_id); end if;
    update public.event_rsvps set checked_in_at = now() where id = v_rsvp.id;
  end if;
  return jsonb_build_object('valid', true, 'rsvp', (p_event_id is not null and v_rsvp.id is not null), 'name', v_member.full_name, 'tier', v_member.tier::text, 'display_id', v_member.display_id, 'city', v_member.city, 'company', v_member.company);
end; $fn$;

revoke execute on function public.ensure_daily_seed() from public, anon, authenticated;
revoke execute on function public.generate_barcode_token(uuid) from public, anon, authenticated;
revoke execute on function public.verify_barcode(text, bigint) from public, anon, authenticated;
grant execute on function public.generate_barcode_token(uuid) to authenticated;
grant execute on function public.verify_barcode(text, bigint) to authenticated;

-- 6. change_member_tier hardening
create or replace function public.change_member_tier(p_member_id uuid, p_new_tier membership_tier, p_reason text, p_changed_by uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); v_old_tier membership_tier;
begin
  if v_actor is null then return jsonb_build_object('success', false, 'error', 'Not authenticated'); end if;
  if p_changed_by is not null and p_changed_by <> v_actor then return jsonb_build_object('success', false, 'error', 'Cannot act on behalf of another member'); end if;
  if not public.is_admin() then return jsonb_build_object('success', false, 'error', 'Not authorized'); end if;
  select tier into v_old_tier from public.members where id = p_member_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Member not found'); end if;
  if v_old_tier = p_new_tier then return jsonb_build_object('success', false, 'error', 'Already at this tier'); end if;
  update public.members set tier = p_new_tier where id = p_member_id;
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('tier', p_new_tier::text) where id = p_member_id;
  insert into public.tier_changes (member_id, old_tier, new_tier, changed_by, reason) values (p_member_id, v_old_tier, p_new_tier, v_actor, p_reason);
  insert into public.notifications (member_id, type, title, body, data) values (p_member_id, 'tier_change', 'Your membership has been updated', 'You are now an AMARI ' || initcap(p_new_tier::text) || ' member.', jsonb_build_object('old_tier', v_old_tier::text, 'new_tier', p_new_tier::text));
  return jsonb_build_object('success', true, 'old_tier', v_old_tier::text, 'new_tier', p_new_tier::text);
end; $fn$;

revoke execute on function public.change_member_tier(uuid, membership_tier, text, uuid) from public, anon, authenticated;
grant execute on function public.change_member_tier(uuid, membership_tier, text, uuid) to authenticated;

-- 7. aligned_decide hardening
create or replace function public.aligned_decide(p_match_id bigint, p_member_id uuid, p_decision text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); v_match public.aligned_matches%rowtype; v_is_a boolean;
begin
  if v_actor is null then return jsonb_build_object('success', false, 'error', 'Not authenticated'); end if;
  if p_member_id is not null and p_member_id <> v_actor then return jsonb_build_object('success', false, 'error', 'Cannot decide on behalf of another member'); end if;
  if p_decision not in ('accept', 'pass') then return jsonb_build_object('success', false, 'error', 'Invalid decision'); end if;
  select * into v_match from public.aligned_matches where id = p_match_id for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Match not found'); end if;
  if v_match.stage not in ('new', 'accepted') then return jsonb_build_object('success', false, 'error', 'Match already resolved'); end if;
  v_is_a := (v_actor = v_match.member_a);
  if not v_is_a and v_actor <> v_match.member_b then return jsonb_build_object('success', false, 'error', 'Not your match'); end if;
  if v_is_a then update public.aligned_matches set a_decision = p_decision where id = p_match_id;
  else update public.aligned_matches set b_decision = p_decision where id = p_match_id; end if;
  select * into v_match from public.aligned_matches where id = p_match_id;
  if p_decision = 'pass' then update public.aligned_matches set stage = 'declined' where id = p_match_id; return jsonb_build_object('success', true, 'stage', 'declined'); end if;
  if v_match.a_decision = 'accept' and v_match.b_decision = 'accept' then update public.aligned_matches set stage = 'revealed' where id = p_match_id; return jsonb_build_object('success', true, 'stage', 'revealed'); end if;
  update public.aligned_matches set stage = 'accepted' where id = p_match_id;
  return jsonb_build_object('success', true, 'stage', 'accepted');
end; $fn$;

revoke execute on function public.aligned_decide(bigint, uuid, text) from public, anon, authenticated;
grant execute on function public.aligned_decide(bigint, uuid, text) to authenticated;

do $chk$ begin
  if exists (select 1 from pg_proc where proname = 'generate_weekly_matches') then
    revoke execute on function public.generate_weekly_matches() from public, anon, authenticated;
  end if;
end; $chk$;

-- 8. Aligned RLS
drop policy if exists "Users can CRUD own tiles" on public.aligned_tiles;
drop policy if exists "Users can read active tiles" on public.aligned_tiles;
drop policy if exists "aligned_tiles_own" on public.aligned_tiles;
drop policy if exists "aligned_tiles_own_crud" on public.aligned_tiles;
drop policy if exists "aligned_tiles_discovery" on public.aligned_tiles;

create policy "aligned_tiles_own_crud" on public.aligned_tiles for all to authenticated using (user_id = auth.uid());
create policy "aligned_tiles_discovery" on public.aligned_tiles for select to authenticated using (is_active = true and user_id <> auth.uid() and public.is_active_member() and public.tier_level(public.get_member_tier()) >= public.tier_level('platinum'::membership_tier));

drop policy if exists "Users can manage own interests" on public.aligned_interests;
drop policy if exists "aligned_interests_select" on public.aligned_interests;
drop policy if exists "aligned_interests_insert" on public.aligned_interests;
create policy "aligned_interests_select" on public.aligned_interests for select to authenticated using (from_user_id = auth.uid());
create policy "aligned_interests_insert" on public.aligned_interests for insert to authenticated with check (from_user_id = auth.uid() and public.is_active_member() and exists (select 1 from public.aligned_tiles t where t.id = to_tile_id and t.is_active = true and t.user_id <> auth.uid()));

drop policy if exists "Users can manage own skips" on public.aligned_skips;
drop policy if exists "aligned_skips_select" on public.aligned_skips;
drop policy if exists "aligned_skips_insert" on public.aligned_skips;
create policy "aligned_skips_select" on public.aligned_skips for select to authenticated using (user_id = auth.uid());
create policy "aligned_skips_insert" on public.aligned_skips for insert to authenticated with check (user_id = auth.uid() and public.is_active_member());

drop policy if exists "Users can view own connections" on public.connections;
drop policy if exists "connections_read_own" on public.connections;
create policy "connections_read_own" on public.connections for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());

-- 9. Storage
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false) on conflict (id) do update set public = false;
alter table public.aligned_tiles add column if not exists image_path text;

drop policy if exists "auth_upload" on storage.objects;
drop policy if exists "auth_manage_own" on storage.objects;
drop policy if exists "auth_delete_own" on storage.objects;
drop policy if exists "auth_read_uploads" on storage.objects;
drop policy if exists "uploads_insert_aligned_own" on storage.objects;
drop policy if exists "uploads_update_aligned_own" on storage.objects;
drop policy if exists "uploads_delete_aligned_own" on storage.objects;
drop policy if exists "uploads_select_aligned_authenticated" on storage.objects;

create policy "uploads_insert_aligned_own" on storage.objects for insert to authenticated with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = 'aligned-tiles' and (storage.foldername(name))[2] = auth.uid()::text and public.is_active_member());
create policy "uploads_delete_aligned_own" on storage.objects for delete to authenticated using (bucket_id = 'uploads' and (storage.foldername(name))[1] = 'aligned-tiles' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "uploads_select_aligned_authenticated" on storage.objects for select to authenticated using (bucket_id = 'uploads' and (storage.foldername(name))[1] = 'aligned-tiles' and public.is_active_member());

-- 10. Internal tables lockdown
do $chk$ begin
  if to_regclass('public.rate_limits') is not null then execute 'alter table public.rate_limits enable row level security'; end if;
  if to_regclass('public.dead_letter_queue') is not null then execute 'alter table public.dead_letter_queue enable row level security'; end if;
end; $chk$;

-- 11. Performance indexes
create index if not exists idx_event_rsvps_member on public.event_rsvps(member_id);
create index if not exists idx_event_rsvps_event_status on public.event_rsvps(event_id, status);
create index if not exists idx_notifications_member on public.notifications(member_id);
create index if not exists idx_aligned_tiles_user_active on public.aligned_tiles(user_id, is_active);
create index if not exists idx_connections_users on public.connections(user_a, user_b);

commit;
