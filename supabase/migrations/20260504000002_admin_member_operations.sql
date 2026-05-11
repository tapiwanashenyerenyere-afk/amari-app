-- Admin member operations used by the mobile admin panel.
-- These functions preserve member history: suspending a member changes status
-- without deleting member rows, connections, projects, or audit records.

begin;

create or replace function public.admin_set_member_status(
  p_member_id uuid,
  p_status member_status,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
  v_old_status member_status;
  v_member_name text;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  if p_member_id = v_actor then
    return jsonb_build_object('success', false, 'error', 'Admins cannot change their own account status');
  end if;

  select status, full_name
  into v_old_status, v_member_name
  from public.members
  where id = p_member_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Member not found');
  end if;

  if v_old_status = p_status then
    return jsonb_build_object('success', false, 'error', 'Member already has this status');
  end if;

  update public.members
  set status = p_status,
      updated_at = now()
  where id = p_member_id;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('member_status', p_status::text)
  where id = p_member_id;

  insert into public.notifications (member_id, type, title, body, data)
  values (
    p_member_id,
    'account_status',
    'Your AMARI account status changed',
    'Your account is now ' || initcap(p_status::text) || '.',
    jsonb_build_object(
      'old_status', v_old_status::text,
      'new_status', p_status::text,
      'reason', nullif(btrim(coalesce(p_reason, '')), ''),
      'changed_by', v_actor
    )
  );

  return jsonb_build_object(
    'success', true,
    'member_id', p_member_id,
    'member_name', v_member_name,
    'old_status', v_old_status::text,
    'new_status', p_status::text
  );
end;
$fn$;

create or replace function public.admin_create_invitation_code(
  p_recipient_name text,
  p_recipient_email text,
  p_tier membership_tier,
  p_grants_admin boolean default false,
  p_staff_role text default null,
  p_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_actor uuid := auth.uid();
  v_code text;
  v_email text;
  v_staff_role text := nullif(btrim(coalesce(p_staff_role, '')), '');
  v_expires_at timestamptz := coalesce(p_expires_at, now() + interval '90 days');
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  if p_recipient_name is null or btrim(p_recipient_name) = '' then
    return jsonb_build_object('success', false, 'error', 'Recipient name is required');
  end if;

  if p_recipient_email is null or btrim(p_recipient_email) = '' then
    return jsonb_build_object('success', false, 'error', 'Recipient email is required');
  end if;

  if p_tier not in ('member', 'silver', 'platinum', 'laureate') then
    return jsonb_build_object('success', false, 'error', 'Invalid invite tier');
  end if;

  if v_staff_role is not null and v_staff_role not in ('owner', 'admin', 'editor', 'door_staff') then
    return jsonb_build_object('success', false, 'error', 'Invalid staff role');
  end if;

  v_code := upper(public.generate_share_invite_code('AMARI-ADM'));
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
    public.current_invite_month_key(),
    'admin',
    btrim(p_recipient_name),
    v_email,
    p_tier,
    coalesce(p_grants_admin, false),
    v_staff_role,
    v_expires_at
  );

  return jsonb_build_object(
    'success', true,
    'code', v_code,
    'recipient_name', btrim(p_recipient_name),
    'recipient_email', v_email,
    'tier_grant', p_tier::text,
    'grants_admin', coalesce(p_grants_admin, false),
    'staff_role_grant', v_staff_role,
    'expires_at', v_expires_at
  );
end;
$fn$;

revoke execute on function public.admin_set_member_status(uuid, member_status, text) from public, anon, authenticated;
grant execute on function public.admin_set_member_status(uuid, member_status, text) to authenticated;

revoke execute on function public.admin_create_invitation_code(text, text, membership_tier, boolean, text, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_create_invitation_code(text, text, membership_tier, boolean, text, timestamptz) to authenticated;

notify pgrst, 'reload schema';

commit;
