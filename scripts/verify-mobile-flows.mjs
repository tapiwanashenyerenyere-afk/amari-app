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
7. For an existing tester moving from a previous build, tap Already a member? Sign in with email.
8. Enter the same email used in the earlier AMARI build, then enter the one-time email code.
9. Open Aligned, tap Projects, tap at least three project rows, and confirm each opens a project detail screen.
10. On the detail screen, test Keep me updated, Connect with project creator, and any project link.
11. Tap Your pass, test Email details, Share to apps, and Scan pass.

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

if (process.argv.includes('--manual')) {
  process.stdout.write(`${manualTestScript.trim()}\n`);
  process.exit(0);
}

const invite = read('app/(auth)/invite.tsx');
const onboarding = read('components/v2/Onboarding.tsx');
const aligned = read('app/(tabs)/aligned/index.tsx');
const passModal = read('components/v2/CardPopupModal.tsx');

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

process.stdout.write('[verify:mobile-flows] passed\n');
