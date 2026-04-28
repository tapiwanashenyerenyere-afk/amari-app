import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function fail(message) {
  console.error(`[guard:production-update] ${message}`);
  process.exit(1);
}

const appJson = JSON.parse(readFileSync('app.json', 'utf8'));
const updates = appJson.expo?.updates ?? {};
const certificatePath = updates.codeSigningCertificate;
const metadata = updates.codeSigningMetadata ?? {};

if (!certificatePath) {
  fail('Production EAS Update is blocked until expo.updates.codeSigningCertificate is configured.');
}

if (!metadata.keyid || !metadata.alg) {
  fail('Production EAS Update is blocked until expo.updates.codeSigningMetadata.keyid and alg are configured.');
}

if (!existsSync(resolve(certificatePath))) {
  fail(`Production EAS Update code signing certificate was not found at ${certificatePath}.`);
}

process.stdout.write('[guard:production-update] code signing configuration detected\n');
