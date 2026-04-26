-- Auth release hardening for App Review access and in-app account deletion.

begin;

create or replace function public.request_account_deletion()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  update public.members
     set deletion_requested_at = now(),
         expo_push_token = null,
         notification_preferences = jsonb_build_object('pulse', false, 'aligned', false, 'events', false),
         updated_at = now()
   where id = v_actor;

  if not found then
    return jsonb_build_object('success', false, 'error', 'member_not_found');
  end if;

  insert into public.notifications (member_id, type, title, body, data)
  values (
    v_actor,
    'system',
    'Account deletion requested',
    'AMARI has recorded your account deletion request and will complete manual deletion.',
    jsonb_build_object('requested_at', now())
  );

  return jsonb_build_object('success', true);
end;
$fn$;

revoke execute on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;

commit;
