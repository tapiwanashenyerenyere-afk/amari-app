-- Project engagement loop: owners learn who's interested (aggregated),
-- introductions happen by double opt-in (emails shared only after the
-- owner approves), and projects get periodic update nudges.

begin;

-- ─── Contact requests (double opt-in introductions) ─────────────────────
create table if not exists public.project_contact_requests (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  requester_id uuid not null references public.members(id) on delete cascade,
  owner_id uuid not null references public.members(id) on delete cascade,
  message text not null check (char_length(message) between 12 and 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (project_id, requester_id)
);

create index if not exists pcr_owner_idx on public.project_contact_requests (owner_id, status);
alter table public.project_contact_requests enable row level security;
-- No direct table policies: all access via RPCs below (emails are the
-- sensitive payload and only flow after approval).

-- Request an introduction. Owner is notified (trigger below).
create or replace function public.request_project_contact(p_project_id uuid, p_message text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); v_owner uuid;
begin
  if v_actor is null or not is_active_member() then
    return jsonb_build_object('success', false, 'error', 'Not authorised');
  end if;
  select creator_id into v_owner from public.projects where id = p_project_id and status = 'approved';
  if v_owner is null then return jsonb_build_object('success', false, 'error', 'Project not available'); end if;
  if v_owner = v_actor then return jsonb_build_object('success', false, 'error', 'This is your own project'); end if;
  if char_length(btrim(coalesce(p_message, ''))) < 12 then
    return jsonb_build_object('success', false, 'error', 'Add a short note about why you want to connect');
  end if;

  insert into public.project_contact_requests (project_id, requester_id, owner_id, message)
  values (p_project_id, v_actor, v_owner, btrim(p_message))
  on conflict (project_id, requester_id) do nothing;

  if not found then
    return jsonb_build_object('success', false, 'error', 'You have already requested an introduction');
  end if;
  return jsonb_build_object('success', true);
end; $fn$;

-- Owner approves/declines. On approve, both parties may see each other's
-- emails via the list RPCs.
create or replace function public.respond_project_contact(p_request_id bigint, p_approve boolean)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_actor uuid := auth.uid(); v_req public.project_contact_requests%rowtype; v_requester_email text;
begin
  select * into v_req from public.project_contact_requests where id = p_request_id for update;
  if not found or v_req.owner_id <> v_actor then
    return jsonb_build_object('success', false, 'error', 'Not your request');
  end if;
  if v_req.status <> 'pending' then
    return jsonb_build_object('success', false, 'error', 'Already responded');
  end if;

  update public.project_contact_requests
  set status = case when p_approve then 'approved' else 'declined' end,
      responded_at = now()
  where id = p_request_id;

  if p_approve then
    select email into v_requester_email from public.members where id = v_req.requester_id;
    return jsonb_build_object('success', true, 'status', 'approved', 'requester_email', v_requester_email);
  end if;
  return jsonb_build_object('success', true, 'status', 'declined');
end; $fn$;

-- Requests on my projects (owner view): requester identity aggregated
-- until approval; email only after approve.
create or replace function public.get_project_requests(p_project_id uuid)
returns table (id bigint, requester_name text, requester_industry text, requester_email text, message text, status text, created_at timestamptz)
language plpgsql security definer set search_path = public as $fn$
begin
  return query
  select r.id,
         m.full_name,
         m.industry,
         case when r.status = 'approved' then m.email else null end,
         r.message, r.status, r.created_at
  from public.project_contact_requests r
  join public.members m on m.id = r.requester_id
  where r.project_id = p_project_id and r.owner_id = auth.uid()
  order by r.created_at desc;
end; $fn$;

-- My outgoing request on a project (requester view): owner email revealed
-- only once approved.
create or replace function public.get_my_project_request(p_project_id uuid)
returns table (id bigint, status text, owner_email text, responded_at timestamptz)
language plpgsql security definer set search_path = public as $fn$
begin
  return query
  select r.id, r.status,
         case when r.status = 'approved' then m.email else null end,
         r.responded_at
  from public.project_contact_requests r
  join public.members m on m.id = r.owner_id
  where r.project_id = p_project_id and r.requester_id = auth.uid();
end; $fn$;

revoke execute on function public.request_project_contact(uuid, text) from public, anon;
revoke execute on function public.respond_project_contact(bigint, boolean) from public, anon;
revoke execute on function public.get_project_requests(uuid) from public, anon;
revoke execute on function public.get_my_project_request(uuid) from public, anon;
grant execute on function public.request_project_contact(uuid, text) to authenticated;
grant execute on function public.respond_project_contact(bigint, boolean) to authenticated;
grant execute on function public.get_project_requests(uuid) to authenticated;
grant execute on function public.get_my_project_request(uuid) to authenticated;

-- ─── Instant pushes via triggers → edge function ─────────────────────────
create or replace function public.notify_project_engagement()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_secret text; v_mode text; v_id bigint;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'news_pipeline_secret';
  if v_secret is null then return coalesce(new, old); end if;

  if tg_table_name = 'project_contact_requests' and tg_op = 'INSERT' then
    v_mode := 'contact_request'; v_id := new.id;
  elsif tg_table_name = 'project_contact_requests' and tg_op = 'UPDATE' and new.status <> old.status then
    v_mode := 'contact_response'; v_id := new.id;
  else
    return coalesce(new, old);
  end if;

  perform net.http_post(
    url := 'https://eavnuxccdxqyzvnspmaq.supabase.co/functions/v1/project-engagement',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-amari-pipeline-secret', v_secret),
    body := jsonb_build_object('mode', v_mode, 'request_id', v_id),
    timeout_milliseconds := 8000
  );
  return coalesce(new, old);
end; $fn$;

drop trigger if exists tr_pcr_notify on public.project_contact_requests;
create trigger tr_pcr_notify
  after insert or update on public.project_contact_requests
  for each row execute function public.notify_project_engagement();

-- ─── Update-nudge + follow-digest bookkeeping ────────────────────────────
alter table public.projects
  add column if not exists update_reminded_at timestamptz,
  add column if not exists follows_pushed_at timestamptz;

notify pgrst, 'reload schema';

commit;
