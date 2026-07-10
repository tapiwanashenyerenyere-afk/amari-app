-- In-app issue reporting. Members flag problems; every admin is pushed
-- immediately so nothing goes unseen. Admins triage from the command centre.

begin;

create table if not exists public.issue_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.members(id) on delete cascade,
  category text not null default 'other' check (category in ('bug', 'content', 'account', 'payment', 'suggestion', 'other')),
  message text not null check (char_length(message) between 5 and 2000),
  app_version text,
  platform text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  resolved_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issue_reports_status_idx on public.issue_reports (status, created_at desc);

alter table public.issue_reports enable row level security;

-- Reporter can file and see their own; admins see and manage all.
drop policy if exists "issue_reports_insert_own" on public.issue_reports;
create policy "issue_reports_insert_own"
  on public.issue_reports for insert
  to authenticated
  with check (reporter_id = auth.uid() and is_active_member());

drop policy if exists "issue_reports_select" on public.issue_reports;
create policy "issue_reports_select"
  on public.issue_reports for select
  to authenticated
  using (reporter_id = auth.uid() or is_admin());

drop policy if exists "issue_reports_admin_update" on public.issue_reports;
create policy "issue_reports_admin_update"
  on public.issue_reports for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- File a report (captures app version/platform for triage).
create or replace function public.report_issue(
  p_category text,
  p_message text,
  p_app_version text default null,
  p_platform text default null
)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); v_id bigint;
begin
  if v_actor is null or not is_active_member() then
    return jsonb_build_object('success', false, 'error', 'Not authorised');
  end if;
  if char_length(btrim(coalesce(p_message, ''))) < 5 then
    return jsonb_build_object('success', false, 'error', 'Please describe the issue');
  end if;

  insert into public.issue_reports (reporter_id, category, message, app_version, platform)
  values (
    v_actor,
    case when p_category in ('bug','content','account','payment','suggestion','other') then p_category else 'other' end,
    btrim(p_message),
    nullif(btrim(coalesce(p_app_version, '')), ''),
    nullif(btrim(coalesce(p_platform, '')), '')
  )
  returning id into v_id;

  return jsonb_build_object('success', true, 'id', v_id);
end; $fn$;

-- Admin: update triage status.
create or replace function public.set_issue_status(p_id bigint, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null or not is_admin() then
    return jsonb_build_object('success', false, 'error', 'Not authorised');
  end if;
  if p_status not in ('open', 'reviewing', 'resolved') then
    return jsonb_build_object('success', false, 'error', 'Invalid status');
  end if;
  update public.issue_reports
  set status = p_status,
      resolved_by = case when p_status = 'resolved' then auth.uid() else resolved_by end,
      updated_at = now()
  where id = p_id;
  return jsonb_build_object('success', true);
end; $fn$;

revoke execute on function public.report_issue(text, text, text, text) from public, anon;
revoke execute on function public.set_issue_status(bigint, text) from public, anon;
grant execute on function public.report_issue(text, text, text, text) to authenticated;
grant execute on function public.set_issue_status(bigint, text) to authenticated;

-- New report → notify every admin via the engagement edge function.
create or replace function public.notify_admins_of_issue()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_secret text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'news_pipeline_secret';
  if v_secret is null then return new; end if;
  perform net.http_post(
    url := 'https://eavnuxccdxqyzvnspmaq.supabase.co/functions/v1/notify-admins',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-amari-pipeline-secret', v_secret),
    body := jsonb_build_object('mode', 'issue', 'issue_id', new.id),
    timeout_milliseconds := 8000
  );
  return new;
end; $fn$;

drop trigger if exists tr_issue_notify on public.issue_reports;
create trigger tr_issue_notify
  after insert on public.issue_reports
  for each row execute function public.notify_admins_of_issue();

notify pgrst, 'reload schema';

commit;
