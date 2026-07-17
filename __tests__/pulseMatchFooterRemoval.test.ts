import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

function runtimeSource(directory: string): string {
  const absolute = resolve(process.cwd(), directory);
  return readdirSync(absolute, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(absolute, entry.name);
      if (entry.isDirectory()) return runtimeSource(path);
      return ['.ts', '.tsx'].includes(extname(entry.name)) ? [readFileSync(path, 'utf8')] : [];
    })
    .join('\n');
}

describe('Pulse fabricated match footer removal', () => {
  const source = ['app', 'components', 'lib'].map(runtimeSource).join('\n');

  it('cannot render the fabricated profile-match claim', () => {
    expect(source).not.toMatch(/Matched to .*profile/i);
  });

  it('removes the helper and the complete prop, render, divider, and style cascade', () => {
    for (const staleName of ['getPulseMatchFooter', 'matchFooter', 'styles.matchFooter', 'styles.nomineeFooter']) {
      expect(source).not.toContain(staleName);
    }
  });
});
