import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const requiredEnvKeys = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_AUTH_REDIRECT_URL',
];

const allowedRedirects = new Set([
  'amari://auth-callback',
  'https://www.amarigroupau.com/auth-callback',
]);

function parseJsonFile(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[verify:release] ${message}`);
    process.exit(1);
  }
}

function validateStaticReleaseConfig() {
  const appJson = parseJsonFile('app.json');
  const easJson = parseJsonFile('eas.json');
  const packageJson = parseJsonFile('package.json');
  const appConfig = appJson.expo ?? {};
  const iosConfig = appConfig.ios ?? {};
  const plugins = appConfig.plugins ?? [];
  const easProjectId = appConfig.extra?.eas?.projectId;

  assert(appConfig.scheme === 'amari', 'expo.scheme must stay "amari" for auth callbacks.');
  assert(Boolean(packageJson.dependencies?.['expo-updates']), 'expo-updates must stay installed for EAS Update support.');
  assert(Boolean(easProjectId), 'expo.extra.eas.projectId is required for EAS Update support.');
  assert(
    appConfig.updates?.url === `https://u.expo.dev/${easProjectId}`,
    'expo.updates.url must target the EAS project update endpoint.',
  );
  assert(
    appConfig.runtimeVersion?.policy === 'appVersion',
    'expo.runtimeVersion.policy must stay "appVersion" so OTA updates match native runtime compatibility.',
  );
  assert(iosConfig.usesAppleSignIn === true, 'ios.usesAppleSignIn must be true when Google login is available on iOS.');
  assert(
    plugins.some((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === 'expo-apple-authentication'),
    'expo-apple-authentication plugin must be configured.',
  );
  assert(
    iosConfig.infoPlist?.ITSAppUsesNonExemptEncryption === false,
    'ITSAppUsesNonExemptEncryption must be set to false for App Store Connect export compliance.',
  );

  for (const profileName of ['preview', 'production']) {
    const env = easJson.build?.[profileName]?.env ?? {};

    for (const key of requiredEnvKeys) {
      assert(Boolean(env[key]), `${profileName} is missing ${key}.`);
    }

    assert(
      allowedRedirects.has(env.EXPO_PUBLIC_AUTH_REDIRECT_URL),
      `${profileName} auth redirect must be one of: ${Array.from(allowedRedirects).join(', ')}.`,
    );
    assert(!/localhost|127\.0\.0\.1/i.test(JSON.stringify(env)), `${profileName} env must not contain localhost redirects.`);
  }

  for (const profileName of ['development', 'preview', 'production']) {
    assert(
      easJson.build?.[profileName]?.environment === profileName,
      `${profileName} build profile must use the matching EAS environment for update-safe env vars.`,
    );
    assert(
      easJson.build?.[profileName]?.channel === profileName,
      `${profileName} build profile must use the matching EAS Update channel.`,
    );
  }

  assert(
    packageJson.scripts?.['update:preview:ios']?.includes('--channel preview') &&
      packageJson.scripts?.['update:preview:ios']?.includes('--environment preview') &&
      packageJson.scripts?.['update:preview:ios']?.includes('--platform ios'),
    'update:preview:ios must publish iOS only to the preview channel with the preview EAS environment.',
  );
  assert(
    packageJson.scripts?.['update:preview:android']?.includes('--channel preview') &&
      packageJson.scripts?.['update:preview:android']?.includes('--environment preview') &&
      packageJson.scripts?.['update:preview:android']?.includes('--platform android'),
    'update:preview:android must publish Android only to the preview channel with the preview EAS environment.',
  );
  assert(
    packageJson.scripts?.['update:production:ios']?.includes('--channel production') &&
      packageJson.scripts?.['update:production:ios']?.includes('--environment production') &&
      packageJson.scripts?.['update:production:ios']?.includes('--platform ios') &&
      packageJson.scripts?.['update:production:ios']?.includes('node ./scripts/guard-production-update.mjs'),
    'update:production:ios must publish iOS only to the production channel with the production EAS environment.',
  );
  assert(
    packageJson.scripts?.['update:production:android']?.includes('--channel production') &&
      packageJson.scripts?.['update:production:android']?.includes('--environment production') &&
      packageJson.scripts?.['update:production:android']?.includes('--platform android') &&
      packageJson.scripts?.['update:production:android']?.includes('node ./scripts/guard-production-update.mjs'),
    'update:production:android must publish Android only to the production channel with the production EAS environment.',
  );
  assert(
    packageJson.scripts?.['verify:security'] === 'node ./scripts/verify-security.mjs',
    'verify:security must stay wired to the security regression checks.',
  );

  const registerSource = readFileSync('app/(auth)/register.tsx', 'utf8');
  const inviteSource = readFileSync('app/(auth)/invite.tsx', 'utf8');
  const layoutSource = readFileSync('app/_layout.tsx', 'utf8');
  const postAuthOnboardingSource = readFileSync('app/(onboarding)/index.tsx', 'utf8');
  const onboardingQuerySource = readFileSync('queries/onboarding.ts', 'utf8');
  const projectMapSource = readFileSync('components/aligned/ProjectMap.tsx', 'utf8');

  assert(registerSource.includes('getAuthRedirectUrl()'), 'registration must use getAuthRedirectUrl() for magic links.');
  assert(registerSource.includes('signInWithApple'), 'iOS registration must expose Sign in with Apple.');
  assert(registerSource.includes('handleOtpVerification'), 'email auth must keep OTP fallback verification.');
  assert(inviteSource.includes('signInWithPassword'), 'reviewer access must keep password sign-in fallback.');
  assert(layoutSource.includes('completeAuthFromUrl'), 'root layout must handle auth callback deep links centrally.');
  assert(layoutSource.includes("currentGroup === '(onboarding)'"), 'root layout must explicitly handle the post-auth onboarding route group.');
  assert(layoutSource.includes("name=\"(onboarding)\""), 'root stack must register the post-auth onboarding route group.');
  assert(layoutSource.includes('useMyOnboardingStatus'), 'root auth guard must use members.onboarded_at for post-auth onboarding gating.');
  assert(
    postAuthOnboardingSource.includes('Drag the white A for a blend') &&
      postAuthOnboardingSource.includes('Domain Specialist') &&
      postAuthOnboardingSource.includes('Artist') &&
      postAuthOnboardingSource.includes('submitOnboarding.mutateAsync'),
    'post-auth onboarding must keep the sharp AMARI graph and submit through the onboarding RPC.',
  );
  assert(
    onboardingQuerySource.includes("supabase.rpc('submit_member_onboarding'") &&
      !onboardingQuerySource.includes('p_member_id') &&
      !onboardingQuerySource.includes('p_user_id'),
    'onboarding submit must use the server-derived actor RPC without client-supplied member IDs.',
  );
  assert(!/localhost:3000/i.test(registerSource + inviteSource + layoutSource), 'auth source must not reference localhost:3000.');
  assert(!projectMapSource.includes('attributionEnabled={false}'), 'Mapbox attribution must not be disabled.');
  assert(!projectMapSource.includes('logoEnabled={false}'), 'Mapbox logo must not be disabled.');
}

const steps = [
  {
    command: 'npm run verify:security',
    label: 'Security regression',
  },
  {
    command: 'npm run lint',
    label: 'ESLint',
  },
  {
    command: 'npm run typecheck',
    label: 'TypeScript',
  },
  {
    command: 'npx expo config --json',
    label: 'Expo config',
  },
];

validateStaticReleaseConfig();

for (const step of steps) {
  process.stdout.write(`\n[verify:release] ${step.label}\n`);
  const result = spawnSync(step.command, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.stdout.write('\n[verify:release] passed\n');
