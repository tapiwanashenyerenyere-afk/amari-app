-- Allow mobile admins to review canonical map projects without exposing
-- pending submissions to ordinary members.

begin;

drop policy if exists "Projects admin all" on public.projects;
create policy "Projects admin all"
  on public.projects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.admin_set_project_status(
  p_project_id uuid,
  p_status project_status,
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

  if p_status not in ('pending', 'approved', 'rejected') then
    return jsonb_build_object('success', false, 'error', 'Invalid project status');
  end if;

  update public.projects
  set status = p_status,
      published_at = case when p_status = 'approved' then coalesce(published_at, now()) else null end,
      rejection_reason = case when p_status = 'rejected' then nullif(btrim(coalesce(p_reason, '')), '') else null end,
      updated_at = now()
  where id = p_project_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Project not found');
  end if;

  perform public.refresh_map_cache();

  return jsonb_build_object(
    'success', true,
    'project_id', p_project_id,
    'status', p_status::text
  );
end;
$fn$;

revoke execute on function public.admin_set_project_status(uuid, project_status, text) from public, anon, authenticated;
grant execute on function public.admin_set_project_status(uuid, project_status, text) to authenticated;

notify pgrst, 'reload schema';

commit;
