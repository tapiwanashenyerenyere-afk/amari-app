import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const sourceRoots = ['app', 'components', 'hooks', 'lib', 'providers', 'queries'];
const ignoredDirs = new Set(['node_modules', '.git', '.expo', 'dist', 'preview']);

function fail(message) {
  console.error(`[verify:security] ${message}`);
  process.exit(1);
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, files);
    } else if (/\.(ts|tsx|js|jsx|mjs|json)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

function read(path) {
  return readFileSync(path, 'utf8');
}

const packageJson = JSON.parse(read('package.json'));
const appSources = sourceRoots.flatMap((root) => walk(root));
const appSourceText = appSources.map((path) => `${path}\n${read(path)}`).join('\n');

if (/SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY|service_role/i.test(appSourceText)) {
  fail('client source references a service-role secret or role.');
}

if (/console\.log\s*\(/.test(appSourceText)) {
  fail('client source contains console.log; production builds must not emit debug logs.');
}

if (/\.from\(['"]members['"]\)[\s\S]{0,300}\.update\(\s*\{[^}]*onboarded_at/i.test(appSourceText)) {
  fail('client source must not update members.onboarded_at directly; use submit_member_onboarding RPC.');
}

if (/posthog\.capture\s*\([^)]*(otp|invite|invitation|email|token|onboarding)/i.test(appSourceText)) {
  fail('analytics capture appears to include sensitive auth or onboarding fields.');
}

const supabaseSource = read(join('lib', 'supabase.ts'));
if (!supabaseSource.includes("import * as SecureStore from 'expo-secure-store'")) {
  fail('Supabase auth storage must use expo-secure-store on native platforms.');
}

if (!/Platform\.OS\s*===\s*'web'/.test(supabaseSource)) {
  fail('localStorage fallback must stay web-only.');
}

for (const scriptName of ['update:production:ios', 'update:production:android']) {
  const script = packageJson.scripts?.[scriptName] ?? '';
  if (!script.includes('node ./scripts/guard-production-update.mjs')) {
    fail(`${scriptName} must run the production update code-signing guard first.`);
  }
}

const rlsResult = spawnSync('node', ['./scripts/verify-onboarding-security.mjs'], {
  cwd: process.cwd(),
  stdio: 'inherit',
});

if (rlsResult.status !== 0) {
  process.exit(rlsResult.status ?? 1);
}

process.stdout.write('[verify:security] passed\n');
