import { spawnSync } from 'node:child_process';

const steps = [
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
