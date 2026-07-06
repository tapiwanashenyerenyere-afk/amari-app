-- In-app event ticketing v1 (free events).
-- A ticket is a confirmed RSVP presented through the member's rotating
-- daily pass QR. verify_barcode already validates the pass and stamps
-- check-in; this migration adds check-in attribution, cancellation with
-- re-RSVP, and door stats for the admin scanner.

begin;

-- ─── verify_barcode: attribute the check-in to the scanning admin ────────

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
    select * into v_rsvp from public.event_rsvps where event_id = p_event_id and member_id = v_member_id and status <> 'cancelled';
    if not found then return jsonb_build_object('valid', true, 'rsvp', false, 'name', v_member.full_name, 'tier', v_member.tier::text, 'display_id', v_member.display_id, 'warning', 'No ticket for this event'); end if;
    if v_rsvp.status = 'waitlisted' then return jsonb_build_object('valid', true, 'rsvp', true, 'waitlisted', true, 'name', v_member.full_name, 'tier', v_member.tier::text, 'display_id', v_member.display_id, 'warning', 'Waitlisted, admit at door discretion'); end if;
    if v_rsvp.checked_in_at is not null then return jsonb_build_object('valid', true, 'rsvp', true, 'already_checked_in', true, 'checked_in_at', v_rsvp.checked_in_at, 'name', v_member.full_name, 'tier', v_member.tier::text, 'display_id', v_member.display_id); end if;
    update public.event_rsvps set checked_in_at = now(), checked_in_by = auth.uid() where id = v_rsvp.id;
    return jsonb_build_object('valid', true, 'rsvp', true, 'checked_in', true, 'name', v_member.full_name, 'tier', v_member.tier::text, 'display_id', v_member.display_id, 'city', v_member.city, 'company', v_member.company);
  end if;
  return jsonb_build_object('valid', true, 'rsvp', false, 'name', v_member.full_name, 'tier', v_member.tier::text, 'display_id', v_member.display_id, 'city', v_member.city, 'company', v_member.company);
end; $fn$;

revoke execute on function public.verify_barcode(text, bigint) from public, anon;
grant execute on function public.verify_barcode(text, bigint) to authenticated;

-- ─── rsvp_to_event: allow re-RSVP after a cancellation ───────────────────

create or replace function public.rsvp_to_event(p_event_id bigint, p_member_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); v_event public.events%rowtype; v_member public.members%rowtype; v_existing public.event_rsvps%rowtype; v_current_count int; v_status rsvp_status;
begin
  if v_actor is null then return jsonb_build_object('success', false, 'error', 'Not authenticated'); end if;
  if p_member_id is not null and p_member_id <> v_actor then return jsonb_build_object('success', false, 'error', 'Cannot RSVP on behalf of another member'); end if;
  select * into v_event from public.events where id = p_event_id for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Event not found'); end if;
  if v_event.starts_at <= now() then return jsonb_build_object('success', false, 'error', 'This event has already started'); end if;
  select * into v_member from public.members where id = v_actor and status = 'active';
  if not found then return jsonb_build_object('success', false, 'error', 'Member not found or inactive'); end if;
  if public.tier_level(v_member.tier) < public.tier_level(v_event.min_tier) then return jsonb_build_object('success', false, 'error', 'Tier too low for this event'); end if;
  if v_event.early_access_at is not null and now() < v_event.early_access_at then return jsonb_build_object('success', false, 'error', 'RSVPs not yet open'); end if;
  if v_event.general_access_at is not null and now() < v_event.general_access_at and public.tier_level(v_member.tier) < 3 then return jsonb_build_object('success', false, 'error', 'Early access for Platinum+ only'); end if;
  select * into v_existing from public.event_rsvps where event_id = p_event_id and member_id = v_actor;
  if found and v_existing.status <> 'cancelled' then return jsonb_build_object('success', false, 'error', 'Already RSVPd'); end if;
  if v_event.capacity is not null then
    select count(*) into v_current_count from public.event_rsvps where event_id = p_event_id and status = 'confirmed';
    if v_current_count >= v_event.capacity then v_status := 'waitlisted'; else v_status := 'confirmed'; end if;
  else v_status := 'confirmed'; end if;
  if found then
    update public.event_rsvps set status = v_status, checked_in_at = null, checked_in_by = null where id = v_existing.id;
  else
    insert into public.event_rsvps (event_id, member_id, status) values (p_event_id, v_actor, v_status);
  end if;
  return jsonb_build_object('success', true, 'status', v_status::text, 'event_title', v_event.title);
end; $fn$;

revoke execute on function public.rsvp_to_event(bigint, uuid) from public, anon;
grant execute on function public.rsvp_to_event(bigint, uuid) to authenticated;

-- ─── cancel_event_rsvp ───────────────────────────────────────────────────

create or replace function public.cancel_event_rsvp(p_event_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); v_rsvp public.event_rsvps%rowtype; v_event public.events%rowtype;
begin
  if v_actor is null then return jsonb_build_object('success', false, 'error', 'Not authenticated'); end if;
  select * into v_event from public.events where id = p_event_id;
  if not found then return jsonb_build_object('success', false, 'error', 'Event not found'); end if;
  if v_event.starts_at <= now() then return jsonb_build_object('success', false, 'error', 'This event has already started'); end if;
  select * into v_rsvp from public.event_rsvps where event_id = p_event_id and member_id = v_actor for update;
  if not found or v_rsvp.status = 'cancelled' then return jsonb_build_object('success', false, 'error', 'No ticket to cancel'); end if;
  if v_rsvp.checked_in_at is not null then return jsonb_build_object('success', false, 'error', 'Already checked in'); end if;
  update public.event_rsvps set status = 'cancelled' where id = v_rsvp.id;
  return jsonb_build_object('success', true);
end; $fn$;

revoke execute on function public.cancel_event_rsvp(bigint) from public, anon;
grant execute on function public.cancel_event_rsvp(bigint) to authenticated;

-- ─── get_event_checkin_stats (admin scanner header) ──────────────────────

create or replace function public.get_event_checkin_stats(p_event_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_confirmed int; v_waitlisted int; v_checked_in int; v_capacity int;
begin
  if auth.uid() is null or not public.is_admin() then return jsonb_build_object('error', 'Not authorized'); end if;
  select count(*) filter (where status = 'confirmed'),
         count(*) filter (where status = 'waitlisted'),
         count(*) filter (where checked_in_at is not null and status <> 'cancelled')
    into v_confirmed, v_waitlisted, v_checked_in
    from public.event_rsvps where event_id = p_event_id;
  select capacity into v_capacity from public.events where id = p_event_id;
  return jsonb_build_object('confirmed', v_confirmed, 'waitlisted', v_waitlisted, 'checked_in', v_checked_in, 'capacity', v_capacity);
end; $fn$;

revoke execute on function public.get_event_checkin_stats(bigint) from public, anon;
grant execute on function public.get_event_checkin_stats(bigint) to authenticated;

notify pgrst, 'reload schema';

commit;
