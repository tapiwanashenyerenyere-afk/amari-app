begin;

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
  v_existing_member_id uuid;
  v_hash text;
  v_is_staff boolean;
  v_admin_role text;
  v_normalized_email text;
  v_member_email text;
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
     and lower(btrim(v_invite.recipient_email)) <> v_normalized_email
     and v_normalized_email not like '%@privaterelay.appleid.com' then
    return jsonb_build_object(
      'success', false,
      'error', 'email_mismatch'
    );
  end if;

  v_member_email := coalesce(lower(btrim(v_invite.recipient_email)), v_normalized_email);

  select id
    into v_existing_member_id
    from public.members
   where lower(btrim(email)) = v_member_email
     and status in ('active', 'pending')
   order by created_at asc
   limit 1;

  if v_existing_member_id is not null then
    update public.invitation_codes
       set used_by = v_existing_member_id,
           used_at = coalesce(used_at, now())
     where id = v_invite.id
       and used_by is null;

    return jsonb_build_object(
      'success', false,
      'error', 'already_member'
    );
  end if;

  insert into public.members (id, full_name, email, tier, status, city, industry)
  values (
    p_user_id,
    p_full_name,
    v_member_email,
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

  update public.invitation_codes
  set used_by = p_user_id,
      used_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'success', true,
    'tier', v_invite.tier_grant::text,
    'is_admin', v_is_staff,
    'admin_role', v_admin_role
  );
end;
$fn$;

grant execute on function public.redeem_invitation_code(text, uuid, text, text, text, text) to authenticated;

with first_active_member_by_email as (
  select distinct on (lower(btrim(email)))
    id,
    lower(btrim(email)) as email_key
  from public.members
  where status in ('active', 'pending')
  order by lower(btrim(email)), created_at asc
)
update public.invitation_codes invite
   set used_by = member.id,
       used_at = coalesce(invite.used_at, now())
  from first_active_member_by_email member
 where invite.used_by is null
   and invite.recipient_email is not null
   and lower(btrim(invite.recipient_email)) = member.email_key;

commit;
