-- Gold tier wiring. Ladder becomes member(1) < silver(2) < gold(3) <
-- platinum(4) < laureate(5).
--
-- Deliberate consequence: content gates written as tier_level >= 3
-- (Pulse full content, Aligned visibility) now open at GOLD — per the
-- approved strategy, gold-and-above receive all app features/content.
-- Event early access remains platinum-and-above, now stated explicitly.

begin;

create or replace function public.tier_level(t membership_tier)
returns int language sql immutable as $$
  select case t
    when 'member' then 1
    when 'silver' then 2
    when 'gold' then 3
    when 'platinum' then 4
    when 'laureate' then 5
  end;
$$;

-- rsvp_to_event: early-access window stays platinum-and-above, expressed
-- against the enum rather than a magic number.
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
  if v_event.general_access_at is not null and now() < v_event.general_access_at and public.tier_level(v_member.tier) < public.tier_level('platinum'::membership_tier) then return jsonb_build_object('success', false, 'error', 'Early access for Platinum+ only'); end if;
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

-- Invitation codes: gold becomes issuable with its own prefix.
create or replace function public.admin_create_invitation_code(
  p_recipient_name text,
  p_recipient_email text,
  p_tier membership_tier,
  p_grants_admin boolean default false,
  p_staff_role text default null,
  p_expires_at timestamptz default null
)
returns jsonb language plpgsql security definer set search_path = public, extensions as $fn$
declare
  v_actor uuid := auth.uid();
  v_code text;
  v_email text;
  v_expires_at timestamptz := coalesce(p_expires_at, now() + interval '90 days');
  v_prefix text;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;
  if coalesce(p_grants_admin, false) or nullif(btrim(coalesce(p_staff_role, '')), '') is not null then
    return jsonb_build_object('success', false, 'error', 'This panel creates membership codes only');
  end if;
  if p_recipient_name is null or btrim(p_recipient_name) = '' then
    return jsonb_build_object('success', false, 'error', 'Recipient name is required');
  end if;
  if p_recipient_email is null or btrim(p_recipient_email) = '' then
    return jsonb_build_object('success', false, 'error', 'Recipient email is required');
  end if;
  if p_tier not in ('member', 'silver', 'gold', 'platinum', 'laureate') then
    return jsonb_build_object('success', false, 'error', 'Invalid invite tier');
  end if;

  v_prefix := case p_tier
    when 'platinum' then 'AMARI-PLAT'
    when 'gold' then 'AMARI-GOLD'
    when 'silver' then 'AMARI-SLVR'
    when 'laureate' then 'AMARI-LAUR'
    else 'AMARI-MEMB'
  end;

  v_code := upper(public.generate_share_invite_code(v_prefix));
  v_email := lower(btrim(p_recipient_email));

  insert into public.invitation_codes (
    code, code_hash, code_prefix, created_by, issued_by, issued_at, issued_month,
    invite_source, recipient_name, recipient_email, tier_grant, grants_admin,
    staff_role_grant, expires_at
  ) values (
    v_code,
    encode(extensions.digest(v_code, 'sha256'), 'hex'),
    substring(v_code, 1, 10),
    v_actor, v_actor, now(), public.current_invite_month_key(),
    'admin', btrim(p_recipient_name), v_email, p_tier, false, null, v_expires_at
  );

  return jsonb_build_object(
    'success', true,
    'code', v_code,
    'recipient_name', btrim(p_recipient_name),
    'recipient_email', v_email,
    'tier', p_tier::text,
    'expires_at', v_expires_at
  );
end; $fn$;

revoke execute on function public.admin_create_invitation_code(text, text, membership_tier, boolean, text, timestamptz) from public, anon;
grant execute on function public.admin_create_invitation_code(text, text, membership_tier, boolean, text, timestamptz) to authenticated;

notify pgrst, 'reload schema';

commit;
