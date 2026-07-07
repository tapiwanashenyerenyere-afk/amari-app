-- Project updates: projects accumulate a timeline instead of being a
-- static listing. Creators post short updates; members read them on the
-- project page. No public counters anywhere, by design.

begin;

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.members(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 1200),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists project_updates_project_idx
  on public.project_updates (project_id, created_at desc);

alter table public.project_updates enable row level security;

drop policy if exists "project_updates_member_read" on public.project_updates;
create policy "project_updates_member_read"
  on public.project_updates for select
  to authenticated
  using (
    is_active_member()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'approved'
    )
  );

drop policy if exists "project_updates_creator_write" on public.project_updates;
create policy "project_updates_creator_write"
  on public.project_updates for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and is_active_member()
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.creator_id = auth.uid()
        and p.status = 'approved'
    )
  );

drop policy if exists "project_updates_creator_delete" on public.project_updates;
create policy "project_updates_creator_delete"
  on public.project_updates for delete
  to authenticated
  using (author_id = auth.uid());

notify pgrst, 'reload schema';

commit;
