#!/usr/bin/env node
/**
 * Unchecked-Supabase-error ratchet.
 *
 * Why this exists: supabase-js RESOLVES with `{ data, error }` — it does not
 * reject. So `await supabase.from('t').insert({...})` without reading `error`
 * fails completely silently. The 2026-08-02 audit traced a whole family of
 * "feature simply does nothing" bugs back to this one habit: notifications were
 * never delivered, automation triggers never fired, audit reports came back
 * empty, and org suspend/retire reported success while writing nothing. Each
 * looked like a separate bug; they were one missing `if (error)`.
 *
 * `formaos/no-unchecked-supabase-error` is therefore OFF in eslint.config.mjs —
 * there are ~284 pre-existing call sites and turning it on would blow past CI's
 * `--max-warnings` ceiling. This script holds the line the same way the
 * tenant-isolation ratchet does: it fails when the count goes UP. Decreases are
 * always welcome; increases require either checking the new error or an
 * `eslint-disable-next-line` with a justification.
 *
 *   npm run check:supabase-error-ratchet
 *
 * Audit 2026-08-02.
 */

import { execFileSync } from 'node:child_process';
import process from 'node:process';

// Baseline measured 2026-08-03 across lib/ and app/ (tests excluded). Lower
// this number in the same PR whenever you land a batch of fixes.
const BASELINE = 284;

const RULE = 'formaos/no-unchecked-supabase-error';

function runLint() {
  try {
    return execFileSync(
      'npx',
      [
        '--no-install',
        'eslint',
        '--no-config-lookup',
        '--config',
        'eslint.supabase-errors.config.mjs',
        '--no-error-on-unmatched-pattern',
        'lib/',
        'app/',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (err) {
    // ESLint exits non-zero when warnings are present; we still want stdout.
    return (err.stdout ?? '') + (err.stderr ?? '');
  }
}

function countRuleHits(output) {
  return output.split('\n').filter((line) => line.includes(RULE)).length;
}

function main() {
  const count = countRuleHits(runLint());

  console.log(`unchecked Supabase error warnings: ${count} (baseline ${BASELINE})`);

  if (count > BASELINE) {
    console.error('');
    console.error('✗ Unchecked-Supabase-error ratchet exceeded.');
    console.error(`  Expected ≤ ${BASELINE} warnings, found ${count}.`);
    console.error('');
    console.error('  supabase-js resolves with { data, error } and never rejects, so an');
    console.error('  unchecked write fails silently. Either:');
    console.error('    1. Destructure `error` and handle it (throw, or log via the module');
    console.error('       logger and return a typed failure), or');
    console.error('    2. Add .throwOnError() to the query chain, or');
    console.error('    3. If the write is genuinely best-effort, add an');
    console.error('       `eslint-disable-next-line formaos/no-unchecked-supabase-error`');
    console.error('       with a comment saying why losing the failure is acceptable.');
    console.error('');
    console.error('  Run `npx eslint --no-config-lookup -c eslint.supabase-errors.config.mjs lib/ app/`');
    console.error('  to see the full punch list.');
    process.exit(1);
  }

  if (count < BASELINE) {
    console.log('');
    console.log('✓ Count dropped below baseline.');
    console.log(
      `  Lower BASELINE in scripts/check-unchecked-supabase-error-ratchet.mjs from ${BASELINE} to ${count} in this PR to lock in the gain.`,
    );
  } else {
    console.log('✓ Unchecked-Supabase-error ratchet held.');
  }
}

main();
