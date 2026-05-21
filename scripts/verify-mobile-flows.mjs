import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[verify:mobile-flows] ${message}`);
    process.exit(1);
  }
}

const manualTestScript = `
AMARI iOS and Android tester script

iOS TestFlight
1. Open the TestFlight invite link on the iPhone.
2. Install Apple's TestFlight app if iOS asks for it.
3. Accept the AMARI invite in TestFlight and install AMARI.
4. Open AMARI.
5. For a new tester, tap Invitation Code and enter the assigned AMARI code.
6. Continue with email, enter the tester email, then enter the one-time email code.
7. For Apple sign-in testing, enter an invite code first, then use Sign in with Apple. Hide My Email must still activate the invite and reach the member experience.
8. For an existing tester moving from a previous build, tap Already a member? Sign in with email.
9. Enter the same email used in the earlier AMARI build, then enter the one-time email code.
10. Open Aligned, tap Projects, tap at least three project rows, and confirm each opens a project detail screen.
11. On the detail screen, test Keep me updated, Connect with project creator, and any project link.
12. Tap Your pass, test Email details, Share to apps, and Scan pass.

Android Play Store
1. Open the AMARI Play Store listing or closed/production testing link on the Android phone.
2. Install or update AMARI from Google Play.
3. Open AMARI.
4. For a new tester, tap Invitation Code and enter the assigned AMARI code.
5. Continue with email, enter the tester email, then enter the one-time email code.
6. For Tinashe, use Play Store on Android, not TestFlight. Use code AMARI-SLVR-A3B44BDA and email tinashemapindu@yahoo.com.au if this is his first redemption.
7. If the code has already been redeemed, tap Already a member? Sign in with email and use tinashemapindu@yahoo.com.au.
8. Open Aligned, tap Projects, tap at least three project rows, and confirm each opens a project detail screen.
9. On the detail screen, test Keep me updated, Connect with project creator, and any project link.
10. Tap Your pass, test Email details, Share to apps, and Scan pass.
`;

const tinasheAndroidTestScript = `
AMARI Android tester script for Tinashe

Tester account
- Platform: Android through Google Play Alpha/closed testing, not Apple TestFlight.
- AMARI login email: tinashemapindu@yahoo.com.au
- Google Play tester account: use tinashemapindu@yahoo.com.au only if that is the Google account on his Android phone. If Play Store uses a different Gmail or Google Workspace account, add that Google account to the tester list and still use tinashemapindu@yahoo.com.au inside AMARI.
- AMARI invite code: AMARI-SLVR-A3B44BDA
- Auth method: email one-time code. Do not use Apple sign-in for this tester.

Play Console prerequisite
1. In Google Play Console, add Tinashe's Android Play Store Google account to the Alpha/closed testing tester list or the tester Google Group.
2. Send Tinashe the Android closed-testing opt-in link, not a TestFlight link.
3. Confirm the available Android release is AMARI 1.1.2, versionCode 52 or newer.

Android install and sign-in
1. Open the Google Play closed-testing opt-in link on Tinashe's Android phone.
2. Opt in to testing, then install or update AMARI from Google Play.
3. Open AMARI.
4. If this is his first redemption, tap Invitation Code and enter AMARI-SLVR-A3B44BDA.
5. Continue with email using tinashemapindu@yahoo.com.au.
6. Enter the one-time email code.
7. If the invite code has already been redeemed, tap Already a member? Sign in with email.
8. Sign in with tinashemapindu@yahoo.com.au and enter the one-time email code.

Regression checks
1. Confirm the app reaches the main member experience without a network error.
2. Open Aligned, tap Projects, then tap at least three project rows.
3. Confirm each project opens a detail view without requiring Save first.
4. In project detail, test Keep me updated, Save, Connect with project creator, and any project link.
5. Tap Your pass, then Email details.
6. If no mail app opens, confirm the Android share sheet appears.
7. Test Share to apps and Scan pass.

Pass/fail notes to collect
- Device model and Android version.
- Installed AMARI version/build shown by Google Play if visible.
- Whether invite-code path or returning-member email sign-in was used.
- Screenshots or exact text for any network/auth/project/pass failure.
`;

if (process.argv.includes('--manual')) {
  process.stdout.write(`${manualTestScript.trim()}\n`);
  process.exit(0);
}

if (process.argv.includes('--tinashe-android')) {
  process.stdout.write(`${tinasheAndroidTestScript.trim()}\n`);
  process.exit(0);
}

const invite = read('app/(auth)/invite.tsx');
const register = read('app/(auth)/register.tsx');
const rootLayout = read('app/_layout.tsx');
const onboarding = read('components/v2/Onboarding.tsx');
const aligned = read('app/(tabs)/aligned/index.tsx');
const passModal = read('components/v2/CardPopupModal.tsx');
const privateRelayMigration = read('supabase/migrations/20260521000001_allow_apple_private_relay_invites.sql');
const duplicateInviteMigration = read('supabase/migrations/20260521000002_retire_duplicate_member_invites.sql');

assert(
  invite.includes("'member' | 'password'") &&
    invite.includes('handleMemberEmailAuth') &&
    invite.includes('handleMemberOtpVerification'),
  'Invite screen must include returning-member email OTP sign-in.',
);
assert(
  invite.includes('shouldCreateUser: false') &&
    invite.includes("SecureStore.deleteItemAsync('pending_invitation_code')") &&
    invite.includes('getAuthRedirectUrl()'),
  'Returning-member sign-in must not create new users or redeem stale invite codes.',
);
assert(
  invite.includes('Already a member? Sign in with email') &&
    onboarding.includes('Existing members can sign in below.'),
  'Invite validation failure must route existing testers to email sign-in.',
);
assert(
  register.includes('storePendingCode') &&
    register.includes('handleAppleAuth') &&
    register.includes('signInWithApple') &&
    register.includes('pending_invitation_code'),
  'Apple sign-in registration must persist the pending invite code before opening Apple auth.',
);
assert(
  privateRelayMigration.includes('privaterelay.appleid.com') &&
    privateRelayMigration.includes('v_member_email := coalesce(lower(btrim(v_invite.recipient_email)), v_normalized_email)') &&
    privateRelayMigration.includes('v_normalized_email not like') &&
    privateRelayMigration.includes('email_mismatch'),
  'Invite redemption must support Sign in with Apple private relay while keeping real email mismatch protection.',
);
assert(
  duplicateInviteMigration.includes('v_existing_member_id') &&
    duplicateInviteMigration.includes("status in ('active', 'pending')") &&
    duplicateInviteMigration.includes('first_active_member_by_email') &&
    duplicateInviteMigration.includes("'error', 'already_member'"),
  'Invite redemption must retire duplicate codes when the invited email already has an active member.',
);
assert(
  rootLayout.includes('onboardingStatus === null') &&
    rootLayout.includes('Membership not activated') &&
    rootLayout.includes('supabase.auth.signOut()') &&
    rootLayout.includes("router.replace('/(auth)/invite')"),
  'Auth guard must keep users without activated member rows out of post-auth onboarding.',
);
assert(
  aligned.includes('function ProjectDetailModal') &&
    aligned.includes('const [detailProject, setDetailProject]') &&
    aligned.includes('openProjectDetailById') &&
    aligned.includes("onProjectSelect={openProjectDetailById}") &&
    aligned.includes('Keep me updated'),
  'Aligned project taps must open a detail modal with keep-me-updated bookmarking.',
);
assert(
  passModal.includes('No email or share app is available on this device.') &&
    passModal.includes('await Share.share({') &&
    passModal.includes("title: `AMARI pass — ${fullName}`"),
  'Pass Email details must fall back to native sharing when mailto is unavailable.',
);
assert(
  tinasheAndroidTestScript.includes('tinashemapindu@yahoo.com.au') &&
    tinasheAndroidTestScript.includes('AMARI-SLVR-A3B44BDA') &&
    tinasheAndroidTestScript.includes('Google Play Alpha/closed testing') &&
    tinasheAndroidTestScript.includes("Tinashe's Android Play Store Google account") &&
    tinasheAndroidTestScript.includes('not Apple TestFlight'),
  'Tinashe Android test script must use the Android Play tester account and avoid TestFlight.',
);

process.stdout.write('[verify:mobile-flows] passed\n');
