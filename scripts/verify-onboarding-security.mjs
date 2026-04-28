import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function assert(condition, message) {
  if (!condition) {
    console.error(`[verify:onboarding-security] ${message}`);
    process.exit(1);
  }
}

function readMigrations() {
  const migrationDir = join('supabase', 'migrations');
  return readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      file,
      body: readFileSync(join(migrationDir, file), 'utf8'),
    }));
}

const migrations = readMigrations();
const onboardingMigration = migrations.find(({ body }) => body.includes('member_onboarding_responses'));

assert(onboardingMigration, 'member_onboarding_responses migration is missing.');

const sql = onboardingMigration.body.toLowerCase();

const requiredFragments = [
  'create table if not exists public.member_onboarding_responses',
  'create table if not exists public.member_onboarding_evidence_ledger',
  'create table if not exists public.member_onboarding_snapshots',
  'alter table public.member_onboarding_responses enable row level security',
  'alter table public.member_onboarding_evidence_ledger enable row level security',
  'alter table public.member_onboarding_snapshots enable row level security',
  'revoke all on public.member_onboarding_evidence_ledger from public, anon, authenticated',
  'grant select on public.member_onboarding_responses to authenticated',
  'grant select on public.member_onboarding_snapshots to authenticated',
  'member_onboarding_responses_select_own',
  'member_onboarding_snapshots_select_own',
  'create or replace function public.submit_member_onboarding',
  'v_actor uuid := auth.uid()',
  'security definer',
  'set search_path = public',
  'grant execute on function public.submit_member_onboarding',
  'to authenticated',
  'create or replace function public.onboarding_admin_aggregates',
  'create or replace function public.prevent_privileged_member_field_updates',
  "set_config('app.member_onboarding_write', 'on', true)",
  "coalesce(current_setting('app.member_onboarding_write', true) = 'on', false)",
  'new.onboarded_at is distinct from old.onboarded_at',
  'greatest(coalesce(p_min_cohort, 20), 20)',
  'not a member-value score',
];

for (const fragment of requiredFragments) {
  assert(sql.includes(fragment), `${onboardingMigration.file} is missing required fragment: ${fragment}`);
}

assert(!/p_member_id\b/i.test(onboardingMigration.body), 'submit_member_onboarding must not accept client-supplied member IDs.');
assert(
  !/grant\s+select\s+on\s+public\.member_onboarding_evidence_ledger\s+to\s+authenticated/i.test(onboardingMigration.body),
  'mobile clients must not receive direct SELECT access to the evidence ledger.',
);
assert(
  !/create\s+policy\s+"[^"]+"\s+on\s+public\.member_onboarding_responses\s+for\s+(insert|update|delete|all)\b/is.test(onboardingMigration.body),
  'member_onboarding_responses must not expose direct INSERT/UPDATE/DELETE policies to clients.',
);
assert(
  !/create\s+policy\s+"[^"]+"\s+on\s+public\.member_onboarding_evidence_ledger\s+for\s+(select|insert|update|delete|all)\b/is.test(onboardingMigration.body),
  'member_onboarding_evidence_ledger must not expose direct client policies.',
);
assert(
  !/grant\s+(all|insert|update|delete)\s+on\s+public\.member_onboarding_(responses|snapshots|evidence_ledger)\s+to\s+authenticated/i.test(onboardingMigration.body),
  'onboarding tables must not grant direct client write privileges.',
);
assert(
  !/grant\s+update\s*\([^)]*onboarded_at[^)]*\)\s+on\s+public\.members\s+to\s+authenticated/i.test(
    migrations.map(({ body }) => body).join('\n'),
  ),
  'members.onboarded_at must not be client-updatable.',
);
assert(
  !/returns\s+table\s*\([^)]*(member_id|email|full_name|contribution_note)[^)]*\)/i.test(onboardingMigration.body),
  'admin aggregates must not return direct identifiers or sensitive free text.',
);
assert(!/raw_gesture|gesture_trail|screen_replay|session_replay/i.test(sql), 'onboarding must not persist raw gesture trails or replay data.');
assert(!/net_worth|income|bank_account|passport|driver_licen[cs]e/i.test(sql), 'onboarding must not collect high-risk identity or wealth fields.');

process.stdout.write('[verify:onboarding-security] passed\n');
