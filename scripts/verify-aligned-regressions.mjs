import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function fail(message) {
  console.error(`[verify:aligned-regressions] ${message}`);
  process.exit(1);
}

function pass(message) {
  process.stdout.write(`[verify:aligned-regressions] ${message}\n`);
}

function read(path) {
  if (!existsSync(path)) {
    fail(`Missing expected file: ${path}`);
  }
  return readFileSync(path, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function assertIncludes(source, needle, message) {
  assert(source.includes(needle), message);
}

function assertNotIncludes(source, needle, message) {
  assert(!source.includes(needle), message);
}

const aligned = read('app/(tabs)/aligned/index.tsx');
const profile = read('app/(tabs)/profile.tsx');
const mapSheet = read('components/aligned/MapResultsSheet.tsx');
const projectMap = read('components/aligned/ProjectMap.tsx');
const cardPopup = read('components/v2/CardPopupModal.tsx');
const mapbox = read('lib/mapbox.ts');
const migration = read('supabase/migrations/20260504000001_qr_member_connections.sql');
const adminMigration = read('supabase/migrations/20260504000002_admin_member_operations.sql');
const adminInviteHardeningMigration = read('supabase/migrations/20260504000004_admin_invites_membership_only.sql');
const adminInvitePrefixMigration = read('supabase/migrations/20260504000005_admin_invite_tier_prefixes.sql');
const adminProjectReviewMigration = read('supabase/migrations/20260504000006_admin_project_review.sql');
const inviteValidationRateLimitMigration = read('supabase/migrations/20260504000007_invite_validation_rate_limit_fix.sql');
const safeMapRefreshMigration = read('supabase/migrations/20260505000001_safe_map_cache_refresh.sql');
const adminMembers = read('app/admin/members.tsx');
const adminCodes = read('app/admin/codes.tsx');
const adminHome = read('app/(tabs)/admin.tsx');
const adminAligned = read('app/admin/aligned.tsx');
const inviteScreen = read('app/(auth)/invite.tsx');
const onboarding = read('components/v2/Onboarding.tsx');
const appJson = JSON.parse(read('app.json'));
const packageJson = JSON.parse(read('package.json'));

// 1. Project submitter privacy regressions.
assertNotIncludes(
  aligned,
  "creator_first_name, display_label",
  'Aligned directory query must not fetch cached project creator first names.',
);
assertNotIncludes(
  aligned,
  'creator:members!projects_creator_id_fkey(full_name',
  'Aligned project owner join must not fetch creator full names.',
);
assertNotIncludes(
  aligned,
  'creatorPhotoUrl',
  'Aligned project discovery must not render creator profile photos.',
);
assertNotIncludes(
  aligned,
  'creatorFullName',
  'Aligned project discovery must not carry creator full names.',
);
assertNotIncludes(
  aligned,
  '[project.name, project.description, project.creatorLabel',
  'Aligned search must not search project submitter labels.',
);
assertNotIncludes(
  aligned,
  'Projects, members, places',
  'Aligned search placeholder must not imply member search on project discovery.',
);
assertIncludes(
  aligned,
  ".select('id, creator:members!projects_creator_id_fkey(email)')",
  'Aligned owner lookup should fetch contact email only.',
);
assertIncludes(
  profile,
  ".select('project_id, name, description, category')",
  'Profile saved-project cards must not fetch creator first names.',
);
assertIncludes(
  profile,
  "author: 'Project creator'",
  'Profile saved-project cards should label submitters generically.',
);
assertNotIncludes(
  mapSheet,
  'creatorShortName.split',
  'Map sheet contact action must not personalize with creator names.',
);
assertIncludes(
  projectMap,
  "creator_first_name: 'Project creator'",
  'Map feature handoff should neutralize legacy creator_first_name.',
);
assertNotIncludes(
  projectMap,
  'String(properties.creator_first_name',
  'Map project selection must not read creator names from feature properties.',
);
pass('privacy rendering checks passed');

// 2. Required connect-message email handoff regressions.
assertIncludes(
  aligned,
  'const MIN_CONNECT_MESSAGE_LENGTH = 12;',
  'Connect flow must define a minimum message length.',
);
assertIncludes(
  aligned,
  'const connectMessageReady = connectMessage.trim().length >= MIN_CONNECT_MESSAGE_LENGTH;',
  'Connect modal must gate submit readiness on message length.',
);
assertIncludes(
  aligned,
  'disabled={!connectMessageReady}',
  'Connect modal submit button must be disabled until a message is present.',
);
assertIncludes(
  aligned,
  "Alert.alert('Message required'",
  'Connect flow must show a message-required error.',
);
assertIncludes(
  aligned,
  'cleanMessage',
  'Email body must include the user-provided connect message.',
);
assertIncludes(
  aligned,
  '`mailto:${email}?subject=${subject}&body=${body}`',
  'Connect flow must open native email with subject and body.',
);
assertIncludes(
  aligned,
  'Project: ${project.name}',
  'Email body must include the related project name.',
);
assertIncludes(
  aligned,
  'Message the project creator',
  'Connect modal must communicate that the message goes to the project creator.',
);
pass('connect-message checks passed');

// 2b. Aligned core navigation regressions.
assertIncludes(
  aligned,
  "import { CardPopupModal }",
  'Aligned board pass action must open the QR pass modal directly.',
);
assertIncludes(
  aligned,
  'const [showPassPopup, setShowPassPopup] = useState(false);',
  'Aligned board pass action must have local pass modal state.',
);
assertIncludes(
  aligned,
  'setShowPassPopup(true);',
  'Aligned board pass action must open the pass modal instead of navigating away.',
);
assertNotIncludes(
  aligned,
  "router.push('/(tabs)/profile');",
  'Aligned board pass action must not route to Profile as a proxy for QR access.',
);
assertIncludes(
  read('components/aligned/ViewToggle.tsx'),
  "export type AlignedView = 'board' | 'map' | 'list' | 'interests';",
  'Aligned top-level view toggle must include a project list view.',
);
assertIncludes(
  aligned,
  "onOpenMap={() => switchView('list')}",
  'Aligned Projects entry card must open the list-first project view.',
);
assertIncludes(
  aligned,
  'Project list',
  'Aligned project list view must have a visible Project list heading.',
);
assertIncludes(
  aligned,
  "switchView(activeView === 'list' ? 'map' : 'list')",
  'Aligned project list must expose a direct map/list switch.',
);
pass('aligned navigation checks passed');

// 3. QR pass connection RPC regressions.
assertIncludes(
  cardPopup,
  "import { CameraView, useCameraPermissions",
  'Pass modal must use the native camera scanner.',
);
assertIncludes(
  cardPopup,
  "supabase.rpc('connect_with_member_barcode'",
  'Pass scanner must call the member connection RPC.',
);
assertIncludes(cardPopup, 'Scan pass', 'Pass modal must expose a scan action.');
assertIncludes(
  migration,
  "matched_via IN ('project', 'interest', 'pass')",
  'Connections constraint must allow pass-based matches.',
);
assertIncludes(
  migration,
  'CREATE OR REPLACE FUNCTION public.connect_with_member_barcode',
  'QR connection RPC must exist.',
);
assertIncludes(
  migration,
  'v_target_id = v_actor',
  'QR connection RPC must reject self-scans.',
);
assertIncludes(
  migration,
  'v_date_bucket < current_date',
  'QR connection RPC must reject expired passes.',
);
assertIncludes(
  migration,
  'barcode_revocations',
  'QR connection RPC must reject revoked passes.',
);
assertIncludes(
  migration,
  "VALUES (v_actor, v_target_id, 'pass', 'mutual')",
  'QR connection RPC must create mutual pass connections.',
);
assertIncludes(
  migration,
  "'already_connected', true",
  'QR connection RPC must return already_connected for existing mutual connections.',
);
assertIncludes(
  migration,
  'GRANT EXECUTE ON FUNCTION public.connect_with_member_barcode(text) TO authenticated',
  'QR connection RPC must be executable by authenticated members.',
);
pass('QR connection RPC checks passed');

// 4. Native camera config regressions.
assert(
  packageJson.dependencies?.['expo-camera'] === '~17.0.10',
  'expo-camera must stay installed at the SDK 54-compatible version.',
);
const cameraPlugin = appJson.expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-camera');
assert(cameraPlugin, 'app.json must include the expo-camera config plugin.');
assert(
  cameraPlugin[1]?.cameraPermission === 'Allow AMARI to scan member passes and connect with other members.',
  'Camera permission copy must explain AMARI pass scanning.',
);
assert(cameraPlugin[1]?.microphonePermission === false, 'iOS microphone permission must stay disabled.');
assert(cameraPlugin[1]?.recordAudioAndroid === false, 'Android audio recording permission must stay disabled.');

const expoCli = join('node_modules', 'expo', 'bin', 'cli');
const expoConfig = spawnSync(process.execPath, [expoCli, 'config', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (expoConfig.status !== 0) {
  fail(`Expo config could not be generated:\n${expoConfig.error?.message || expoConfig.stderr || expoConfig.stdout}`);
}

const resolvedConfig = JSON.parse(expoConfig.stdout);
assert(
  resolvedConfig.android?.permissions?.includes('android.permission.CAMERA'),
  'Resolved Android config must include camera permission.',
);
assert(
  !resolvedConfig.android?.permissions?.includes('android.permission.RECORD_AUDIO'),
  'Resolved Android config must not include microphone permission.',
);
pass('native camera config checks passed');

// Map styling regression: keep the new border contrast layer.
assertIncludes(mapbox, "id: 'country-border-halo'", 'Fallback map style must keep country border halo contrast.');
assertIncludes(projectMap, 'amari-country-boundary-halo', 'Live map must keep country boundary halo layer.');
pass('map border contrast checks passed');

// Admin operations regression: member management must preserve history and code creation.
assertIncludes(
  adminMigration,
  'connections, projects, or audit records',
  'Admin status migration must document that kick-out preserves member history.',
);
assertIncludes(
  adminMigration,
  'create or replace function public.admin_set_member_status',
  'Admin status RPC must exist.',
);
assertIncludes(
  adminMigration,
  'Admins cannot change their own account status',
  'Admin status RPC must protect admins from locking themselves out.',
);
assertIncludes(
  adminMigration,
  'create or replace function public.admin_create_invitation_code',
  'Admin invitation-code RPC must exist.',
);
assertIncludes(
  adminInviteHardeningMigration,
  'This panel creates membership codes only',
  'Admin invitation-code RPC must reject staff/admin grants from the mobile panel.',
);
assertIncludes(
  adminInviteHardeningMigration,
  "'grants_admin', false",
  'Admin invitation-code RPC must return membership-only grants.',
);
assertIncludes(
  adminInvitePrefixMigration,
  "when 'platinum' then 'AMARI-PLAT'",
  'Admin invitation-code RPC must generate platinum-facing prefixes.',
);
assertIncludes(
  adminInvitePrefixMigration,
  "when 'silver' then 'AMARI-SLVR'",
  'Admin invitation-code RPC must generate silver-facing prefixes.',
);
assertIncludes(
  adminInvitePrefixMigration,
  "when 'laureate' then 'AMARI-LAUR'",
  'Admin invitation-code RPC must generate laureate-facing prefixes.',
);
assertIncludes(
  adminInvitePrefixMigration,
  "else 'AMARI-MEMB'",
  'Admin invitation-code RPC must generate member-facing prefixes.',
);
assertIncludes(
  adminInvitePrefixMigration,
  'v_code := upper(public.generate_share_invite_code(v_prefix));',
  'Admin invitation-code RPC must create random codes from the tier prefix.',
);
assertIncludes(
  inviteValidationRateLimitMigration,
  'create or replace function public.validate_invitation_code',
  'Invite validation rate-limit migration must replace the validation RPC.',
);
assertIncludes(
  inviteValidationRateLimitMigration,
  "where endpoint = 'invite_validate';",
  'Invite validation rate-limit migration must clear existing invite validation lockouts.',
);
assertNotIncludes(
  inviteValidationRateLimitMigration,
  'check_rate_limit',
  'Invite validation must not use a shared anon rate-limit bucket before signup.',
);
assertIncludes(
  inviteScreen,
  'placeholder="AMARI-PLAT-XXXXXXXX"',
  'Invite screen placeholder must match the current tier-code format.',
);
assertIncludes(
  onboarding,
  'placeholder="AMARI-PLAT-XXXXXXXX"',
  'Onboarding invite placeholder must match the current tier-code format.',
);
assertIncludes(
  adminCodes,
  'p_grants_admin: false',
  'Admin code creation must default to non-admin membership codes.',
);
assertIncludes(
  adminMembers,
  '.range(0, 999)',
  'Admin member list must not stay capped at 100 members.',
);
assertIncludes(
  adminMembers,
  "supabase.rpc('admin_set_member_status'",
  'Admin member list must call the status-management RPC.',
);
assertIncludes(adminMembers, 'Kick out', 'Admin member list must expose the kick-out action.');
assertIncludes(
  adminCodes,
  "supabase.rpc('admin_create_invitation_code'",
  'Admin codes screen must create membership codes through the admin RPC.',
);
assertIncludes(adminCodes, 'Create Membership Code', 'Admin codes screen must expose code creation.');
assertIncludes(
  adminProjectReviewMigration,
  'create policy "Projects admin all"',
  'Admin project review migration must allow admins to read pending projects.',
);
assertIncludes(
  adminProjectReviewMigration,
  'create or replace function public.admin_set_project_status',
  'Admin project review migration must expose a project moderation RPC.',
);
assertIncludes(
  adminProjectReviewMigration,
  'perform public.refresh_map_cache();',
  'Approving or rejecting a project must refresh the map cache.',
);
assertIncludes(
  safeMapRefreshMigration,
  'create or replace function public.refresh_map_cache',
  'Safe map refresh migration must replace the cache refresh RPC.',
);
assertIncludes(
  safeMapRefreshMigration,
  'delete from public.map_cache_countries where true;',
  'Map country cache refresh delete must satisfy safe-update WHERE protection.',
);
assertIncludes(
  safeMapRefreshMigration,
  'delete from public.map_cache_states where true;',
  'Map state cache refresh delete must satisfy safe-update WHERE protection.',
);
assertIncludes(
  safeMapRefreshMigration,
  'delete from public.map_cache_projects where true;',
  'Map project cache refresh delete must satisfy safe-update WHERE protection.',
);
assertIncludes(
  adminHome,
  'Submitted Work',
  'Admin home must link to submitted projects and interests.',
);
assertIncludes(
  adminHome,
  "route: '/admin/aligned'",
  'Admin home submitted-work card must route to the aligned admin screen.',
);
assertIncludes(
  adminAligned,
  ".from('projects')",
  'Admin submitted-work screen must fetch canonical project submissions.',
);
assertIncludes(
  adminAligned,
  ".from('aligned_tiles')",
  'Admin submitted-work screen must fetch legacy interest/project tiles.',
);
assertIncludes(
  adminAligned,
  "supabase.rpc('admin_set_project_status'",
  'Admin submitted-work screen must moderate canonical projects.',
);
assertIncludes(
  adminAligned,
  "supabase.rpc('review_aligned_tile'",
  'Admin submitted-work screen must moderate aligned interest/project tiles.',
);
pass('admin operations checks passed');

process.stdout.write('[verify:aligned-regressions] passed\n');
