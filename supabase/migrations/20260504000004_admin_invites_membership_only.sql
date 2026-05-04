-- Keep mobile admin-issued invitation codes membership-only.
-- Staff/admin grants should use a separate audited governance flow.

begin;

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
  v_expires_at timestamptz := coalesce(p_expires_at, now() + interval '90 days');
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

  if p_tier not in ('member', 'silver', 'platinum', 'laureate') then
    return jsonb_build_object('success', false, 'error', 'Invalid invite tier');
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
    false,
    null,
    v_expires_at
  );

  return jsonb_build_object(
    'success', true,
    'code', v_code,
    'recipient_name', btrim(p_recipient_name),
    'recipient_email', v_email,
    'tier_grant', p_tier::text,
    'grants_admin', false,
    'staff_role_grant', null,
    'expires_at', v_expires_at
  );
end;
$fn$;

revoke execute on function public.admin_create_invitation_code(text, text, membership_tier, boolean, text, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_create_invitation_code(text, text, membership_tier, boolean, text, timestamptz) to authenticated;

notify pgrst, 'reload schema';

commit;
