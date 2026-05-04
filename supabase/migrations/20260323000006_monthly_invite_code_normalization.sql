begin;

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
    v_candidate := upper(coalesce(p_prefix, 'AMARI-INV')) || '-' || substring(upper(encode(extensions.gen_random_bytes(4), 'hex')) from 1 for 8);
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

  v_code := upper(public.generate_share_invite_code('AMARI-INV'));
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
    encode(extensions.digest(upper(v_code), 'sha256'), 'hex'),
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

revoke execute on function public.create_monthly_invite(text, text, membership_tier) from public, anon;
grant execute on function public.create_monthly_invite(text, text, membership_tier) to authenticated;

update public.invitation_codes
set code = upper(code),
    code_hash = encode(extensions.digest(upper(code), 'sha256'), 'hex'),
    code_prefix = substring(upper(code), 1, 10)
where invite_source = 'monthly_member';

commit;
