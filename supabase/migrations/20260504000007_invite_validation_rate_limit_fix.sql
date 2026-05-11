-- Do not let pre-signup invite validation share one global anon rate-limit
-- bucket. The RPC still reveals only valid/invalid and still uses the hashed
-- invitation code lookup.

begin;

create or replace function public.validate_invitation_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_hash text;
  v_exists boolean;
begin
  if p_code is null or btrim(p_code) = '' then
    return jsonb_build_object('valid', false);
  end if;

  v_hash := encode(extensions.digest(upper(btrim(p_code)), 'sha256'), 'hex');

  select exists (
    select 1
    from public.invitation_codes
    where code_hash = v_hash
      and used_by is null
      and expires_at > now()
  ) into v_exists;

  return jsonb_build_object('valid', v_exists);
end;
$fn$;

revoke execute on function public.validate_invitation_code(text) from public;
grant execute on function public.validate_invitation_code(text) to anon, authenticated;

delete from public.rate_limits
where endpoint = 'invite_validate';

notify pgrst, 'reload schema';

commit;
