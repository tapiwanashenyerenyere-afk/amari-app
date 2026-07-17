// @ts-nocheck -- Deno supplies the test runtime; app TypeScript uses Node globals.
import {
  buildPrompt,
  costUsd,
  pacingAllowance,
  parseClassifications,
  promptReservationUsd,
} from './core.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

Deno.test('pacing allowance uses the UTC calendar month', () => {
  const start = pacingAllowance(new Date('2026-07-01T00:00:00.000Z'));
  assertEquals(start.month, '2026-07', 'month at boundary');
  assertEquals(start.elapsedFraction, 0, 'fraction at month start');
  assertEquals(start.allowedUsd, 0, 'allowance at month start');

  const halfway = pacingAllowance(new Date('2026-07-16T12:00:00.000Z'));
  assert(Math.abs(halfway.elapsedFraction - 0.5) < 1e-12, 'July midpoint fraction');
  assert(Math.abs(halfway.allowedUsd - 5) < 1e-12, 'July midpoint allowance');

  const august = pacingAllowance(new Date('2026-08-01T00:00:00.000Z'));
  assertEquals(august.month, '2026-08', 'month rollover');
  assertEquals(august.allowedUsd, 0, 'new month resets pacing');
});

Deno.test('reservation prices UTF-8 bytes plus the full output ceiling', () => {
  const rates = { input: 1, output: 5 };
  const ascii = promptReservationUsd('abc', rates);
  const unicode = promptReservationUsd('é', rates);

  assertEquals(ascii, costUsd(3, 2_000, rates), 'ASCII reservation');
  assertEquals(unicode, costUsd(2, 2_000, rates), 'UTF-8 byte reservation');
  assert(unicode > costUsd(1, 2_000, rates), 'multibyte prompt stays conservative');
});

Deno.test('prompt preserves source attribution and bounds snippets', () => {
  const prompt = buildPrompt([
    {
      id: 42,
      title: 'A title',
      snippet: 'x'.repeat(400),
      source: 'Trusted source',
    },
  ]);

  assert(prompt.includes('id: 42'), 'article id included');
  assert(prompt.includes('source: Trusted source'), 'source included');
  assert(!prompt.includes('x'.repeat(281)), 'snippet is bounded');
});

Deno.test('classification parsing filters taxonomy and clamps values', () => {
  const result = parseClassifications(
    '```json\n[{"id":7,"topics":["technology","sports"],"regions":["africa","mars"],"relevance":140,"summary":"ok"}]\n```',
  );

  assertEquals(result.length, 1, 'one classification parsed');
  assertEquals(result[0].topics.join(','), 'technology', 'topic taxonomy');
  assertEquals(result[0].regions.join(','), 'africa', 'region taxonomy');
  assertEquals(result[0].relevance, 100, 'relevance upper bound');
  assertEquals(parseClassifications('not json').length, 0, 'malformed response');
});
