-- Security-first onboarding foundation.
-- Collects structured member signals without exposing raw ledgers or hidden scores.

begin;

do $$
begin
  create type public.onboarding_time_focus as enum (
    'building',
    'investing',
    'operating',
    'creating',
    'performing',
    'specialising'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.onboarding_work_stage as enum (
    'idea',
    'building',
    'launched',
    'traction',
    'scaling',
    'established'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.onboarding_community_need as enum (
    'capital',
    'talent',
    'customers',
    'collaborators',
    'distribution',
    'counsel',
    'community'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.onboarding_evidence_event_type as enum (
    'self_declaration',
    'profile_update',
    'project_signal',
    'event_signal',
    'admin_correction'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.member_onboarding_responses (
  member_id uuid primary key references public.members(id) on delete cascade,
  investor_score numeric(5,2) not null check (investor_score >= 0 and investor_score <= 100),
  founder_score numeric(5,2) not null check (founder_score >= 0 and founder_score <= 100),
  operator_score numeric(5,2) not null check (operator_score >= 0 and operator_score <= 100),
  creator_score numeric(5,2) not null check (creator_score >= 0 and creator_score <= 100),
  domain_specialist_score numeric(5,2) not null check (domain_specialist_score >= 0 and domain_specialist_score <= 100),
  artist_score numeric(5,2) not null check (artist_score >= 0 and artist_score <= 100),
  time_focus public.onboarding_time_focus not null,
  current_stage public.onboarding_work_stage not null,
  community_need public.onboarding_community_need not null,
  consent_version text not null check (length(btrim(consent_version)) between 1 and 80),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    investor_score + founder_score + operator_score + creator_score + domain_specialist_score + artist_score > 0
  )
);

comment on table public.member_onboarding_responses is
  'Owner-visible structured onboarding answers. No free text, raw gesture trail, or hidden member-value score.';

create table if not exists public.member_onboarding_evidence_ledger (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  event_type public.onboarding_evidence_event_type not null,
  source text not null check (source in ('onboarding', 'profile', 'project', 'event', 'admin')),
  axis_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(axis_snapshot) = 'object'),
  answer_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(answer_snapshot) = 'object'),
  confidence numeric(4,3) not null default 0.500 check (confidence >= 0 and confidence <= 1),
  recorded_by uuid references public.members(id),
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

comment on table public.member_onboarding_evidence_ledger is
  'Append-only onboarding evidence source of truth. Not directly readable by mobile clients.';

create table if not exists public.member_onboarding_snapshots (
  member_id uuid primary key references public.members(id) on delete cascade,
  primary_axis text not null check (primary_axis in ('investor', 'founder', 'operator', 'creator', 'domain_specialist', 'artist')),
  secondary_axis text check (secondary_axis in ('investor', 'founder', 'operator', 'creator', 'domain_specialist', 'artist')),
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  scores jsonb not null check (jsonb_typeof(scores) = 'object'),
  updated_at timestamptz not null default now()
);

comment on table public.member_onboarding_snapshots is
  'Materialized onboarding snapshot for matching and aggregate dashboards. Not a member-value score.';

alter table public.member_onboarding_responses enable row level security;
alter table public.member_onboarding_evidence_ledger enable row level security;
alter table public.member_onboarding_snapshots enable row level security;

drop policy if exists "member_onboarding_responses_select_own" on public.member_onboarding_responses;
drop policy if exists "member_onboarding_snapshots_select_own" on public.member_onboarding_snapshots;

create policy "member_onboarding_responses_select_own"
  on public.member_onboarding_responses
  for select
  to authenticated
  using (member_id = auth.uid());

create policy "member_onboarding_snapshots_select_own"
  on public.member_onboarding_snapshots
  for select
  to authenticated
  using (member_id = auth.uid());

revoke all on public.member_onboarding_responses from public, anon, authenticated;
revoke all on public.member_onboarding_evidence_ledger from public, anon, authenticated;
revoke all on public.member_onboarding_snapshots from public, anon, authenticated;
grant select on public.member_onboarding_responses to authenticated;
grant select on public.member_onboarding_snapshots to authenticated;

create or replace function public.onboarding_axis_scores(
  p_investor_score numeric,
  p_founder_score numeric,
  p_operator_score numeric,
  p_creator_score numeric,
  p_domain_specialist_score numeric,
  p_artist_score numeric
)
returns jsonb
language sql
immutable
as $fn$
  select jsonb_build_object(
    'investor', p_investor_score,
    'founder', p_founder_score,
    'operator', p_operator_score,
    'creator', p_creator_score,
    'domain_specialist', p_domain_specialist_score,
    'artist', p_artist_score
  );
$fn$;

create or replace function public.onboarding_ranked_axes(
  p_investor_score numeric,
  p_founder_score numeric,
  p_operator_score numeric,
  p_creator_score numeric,
  p_domain_specialist_score numeric,
  p_artist_score numeric
)
returns table(axis text, axis_score numeric)
language sql
immutable
as $fn$
  select ranked.axis, ranked.axis_score
  from (
    values
      ('investor', p_investor_score),
      ('founder', p_founder_score),
      ('operator', p_operator_score),
      ('creator', p_creator_score),
      ('domain_specialist', p_domain_specialist_score),
      ('artist', p_artist_score)
  ) as ranked(axis, axis_score)
  order by ranked.axis_score desc, ranked.axis asc;
$fn$;

create or replace function public.submit_member_onboarding(
  p_investor_score numeric,
  p_founder_score numeric,
  p_operator_score numeric,
  p_creator_score numeric,
  p_domain_specialist_score numeric,
  p_artist_score numeric,
  p_time_focus text,
  p_current_stage text,
  p_community_need text,
  p_consent_version text default 'onboarding-2026-04-28'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor uuid := auth.uid();
  v_time_focus public.onboarding_time_focus;
  v_current_stage public.onboarding_work_stage;
  v_community_need public.onboarding_community_need;
  v_scores jsonb;
  v_answers jsonb;
  v_primary_axis text;
  v_primary_score numeric;
  v_secondary_axis text;
  v_secondary_score numeric;
  v_confidence numeric;
  v_existing_updated_at timestamptz;
begin
  if v_actor is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  if not exists (
    select 1
    from public.members
    where id = v_actor
      and status in ('active', 'pending')
  ) then
    return jsonb_build_object('success', false, 'error', 'member_not_found');
  end if;

  if coalesce(p_investor_score, -1) < 0 or p_investor_score > 100
    or coalesce(p_founder_score, -1) < 0 or p_founder_score > 100
    or coalesce(p_operator_score, -1) < 0 or p_operator_score > 100
    or coalesce(p_creator_score, -1) < 0 or p_creator_score > 100
    or coalesce(p_domain_specialist_score, -1) < 0 or p_domain_specialist_score > 100
    or coalesce(p_artist_score, -1) < 0 or p_artist_score > 100
    or p_investor_score + p_founder_score + p_operator_score + p_creator_score + p_domain_specialist_score + p_artist_score <= 0 then
    return jsonb_build_object('success', false, 'error', 'invalid_onboarding_payload');
  end if;

  if coalesce(length(btrim(p_consent_version)), 0) < 1 or length(btrim(p_consent_version)) > 80 then
    return jsonb_build_object('success', false, 'error', 'invalid_onboarding_payload');
  end if;

  begin
    v_time_focus := p_time_focus::public.onboarding_time_focus;
    v_current_stage := p_current_stage::public.onboarding_work_stage;
    v_community_need := p_community_need::public.onboarding_community_need;
  exception when invalid_text_representation then
    return jsonb_build_object('success', false, 'error', 'invalid_onboarding_payload');
  end;

  select updated_at
    into v_existing_updated_at
    from public.member_onboarding_responses
   where member_id = v_actor;

  if v_existing_updated_at is not null and v_existing_updated_at > now() - interval '30 seconds' then
    return jsonb_build_object('success', false, 'error', 'rate_limited');
  end if;

  v_scores := public.onboarding_axis_scores(
    p_investor_score,
    p_founder_score,
    p_operator_score,
    p_creator_score,
    p_domain_specialist_score,
    p_artist_score
  );

  v_answers := jsonb_build_object(
    'time_focus', v_time_focus::text,
    'current_stage', v_current_stage::text,
    'community_need', v_community_need::text,
    'consent_version', btrim(p_consent_version)
  );

  select axis, axis_score
    into v_primary_axis, v_primary_score
    from public.onboarding_ranked_axes(
      p_investor_score,
      p_founder_score,
      p_operator_score,
      p_creator_score,
      p_domain_specialist_score,
      p_artist_score
    )
   limit 1;

  select axis, axis_score
    into v_secondary_axis, v_secondary_score
    from public.onboarding_ranked_axes(
      p_investor_score,
      p_founder_score,
      p_operator_score,
      p_creator_score,
      p_domain_specialist_score,
      p_artist_score
    )
   offset 1
   limit 1;

  v_confidence := least(
    1,
    greatest(0.05, (v_primary_score - coalesce(v_secondary_score, 0)) / 100)
  );

  insert into public.member_onboarding_responses (
    member_id,
    investor_score,
    founder_score,
    operator_score,
    creator_score,
    domain_specialist_score,
    artist_score,
    time_focus,
    current_stage,
    community_need,
    consent_version,
    completed_at,
    updated_at
  )
  values (
    v_actor,
    p_investor_score,
    p_founder_score,
    p_operator_score,
    p_creator_score,
    p_domain_specialist_score,
    p_artist_score,
    v_time_focus,
    v_current_stage,
    v_community_need,
    btrim(p_consent_version),
    now(),
    now()
  )
  on conflict (member_id) do update
    set investor_score = excluded.investor_score,
        founder_score = excluded.founder_score,
        operator_score = excluded.operator_score,
        creator_score = excluded.creator_score,
        domain_specialist_score = excluded.domain_specialist_score,
        artist_score = excluded.artist_score,
        time_focus = excluded.time_focus,
        current_stage = excluded.current_stage,
        community_need = excluded.community_need,
        consent_version = excluded.consent_version,
        updated_at = now();

  insert into public.member_onboarding_evidence_ledger (
    member_id,
    event_type,
    source,
    axis_snapshot,
    answer_snapshot,
    confidence,
    recorded_by,
    metadata
  )
  values (
    v_actor,
    'self_declaration',
    'onboarding',
    v_scores,
    v_answers,
    v_confidence,
    v_actor,
    jsonb_build_object('schema_version', '2026-04-28', 'stores_final_values_only', true)
  );

  insert into public.member_onboarding_snapshots (
    member_id,
    primary_axis,
    secondary_axis,
    confidence,
    scores,
    updated_at
  )
  values (
    v_actor,
    v_primary_axis,
    v_secondary_axis,
    v_confidence,
    v_scores,
    now()
  )
  on conflict (member_id) do update
    set primary_axis = excluded.primary_axis,
        secondary_axis = excluded.secondary_axis,
        confidence = excluded.confidence,
        scores = excluded.scores,
        updated_at = now();

  perform set_config('app.member_onboarding_write', 'on', true);

  update public.members
     set onboarded_at = coalesce(onboarded_at, now()),
         updated_at = now()
   where id = v_actor;

  return jsonb_build_object(
    'success', true,
    'primary_axis', v_primary_axis,
    'secondary_axis', v_secondary_axis,
    'confidence', v_confidence
  );
end;
$fn$;

create or replace function public.prevent_privileged_member_field_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_onboarding_write boolean := coalesce(current_setting('app.member_onboarding_write', true) = 'on', false);
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.tier is distinct from old.tier
    or new.status is distinct from old.status
    or new.display_id is distinct from old.display_id
    or new.invited_by is distinct from old.invited_by
    or new.consent_given_at is distinct from old.consent_given_at
    or new.consent_version is distinct from old.consent_version
    or (not v_onboarding_write and new.onboarded_at is distinct from old.onboarded_at) then
    raise exception 'Privileged member fields may not be updated directly';
  end if;

  return new;
end;
$fn$;

create or replace function public.onboarding_admin_aggregates(p_min_cohort integer default 20)
returns table(metric text, segment text, member_count bigint, percentage numeric)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_min_cohort integer := greatest(coalesce(p_min_cohort, 20), 20);
  v_total bigint;
begin
  if auth.uid() is null or not public.is_admin() then
    return;
  end if;

  select count(*) into v_total from public.member_onboarding_responses;

  if v_total < v_min_cohort then
    return;
  end if;

  return query
  select 'time_focus'::text,
         r.time_focus::text,
         count(*)::bigint,
         round((count(*)::numeric / v_total::numeric) * 100, 2)
    from public.member_onboarding_responses r
   group by r.time_focus
  having count(*) >= v_min_cohort

  union all

  select 'current_stage'::text,
         r.current_stage::text,
         count(*)::bigint,
         round((count(*)::numeric / v_total::numeric) * 100, 2)
    from public.member_onboarding_responses r
   group by r.current_stage
  having count(*) >= v_min_cohort

  union all

  select 'community_need'::text,
         r.community_need::text,
         count(*)::bigint,
         round((count(*)::numeric / v_total::numeric) * 100, 2)
    from public.member_onboarding_responses r
   group by r.community_need
  having count(*) >= v_min_cohort

  union all

  select 'primary_axis'::text,
         s.primary_axis,
         count(*)::bigint,
         round((count(*)::numeric / v_total::numeric) * 100, 2)
    from public.member_onboarding_snapshots s
   group by s.primary_axis
  having count(*) >= v_min_cohort;
end;
$fn$;

revoke execute on function public.submit_member_onboarding(
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text,
  text,
  text
) from public, anon;
grant execute on function public.submit_member_onboarding(
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text,
  text,
  text
) to authenticated;

revoke execute on function public.onboarding_admin_aggregates(integer) from public, anon, authenticated;
grant execute on function public.onboarding_admin_aggregates(integer) to authenticated;

commit;
