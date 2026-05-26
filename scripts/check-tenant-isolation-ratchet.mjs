#!/usr/bin/env node
/**
 * Tenant-isolation ratchet.
 *
 * Why this exists: the rule `formaos/no-admin-client-with-org-filter`
 * is intentionally OFF in `eslint.config.mjs` because there are still
 * ~hundreds of legacy `createSupabaseAdminClient + .eq('org_id'|...)`
 * call sites left. Turning the rule on would blow past CI's
 * `--max-warnings 25` ceiling.
 *
 * Until those sites are all migrated to `createSupabaseOrgClient(orgId)`
 * — or explicitly justified with an `eslint-disable-next-line` comment
 * when access is intentionally cross-tenant (cron / executive rollup /
 * billing reconciliation / admin tooling) — this script holds the line:
 * it runs the dedicated tenant-isolation ESLint config and fails if the
 * count of warnings is GREATER than the baseline below. Decreases are
 * always welcome; increases require either fixing the new call site
 * or lowering the baseline in the same PR.
 *
 * Wire-in: add to CI alongside `npm run lint`.
 *
 *   npm run check:tenant-isolation-ratchet
 *
 * Audit 2026-05-26.
 */

import { execFileSync } from 'node:child_process';
import process from 'node:process';

// Baseline as of 2026-05-26 lint run. Lower this number when you land
// a batch of migrations or justifications and the count goes down.
const BASELINE = 312;

const RULE = 'formaos/no-admin-client-with-org-filter';

function runLint() {
  try {
    const out = execFileSync(
      'npx',
      [
        '--no-install',
        'eslint',
        '--config',
        'eslint.tenant-isolation.config.mjs',
        '--ext',
        '.ts,.tsx',
        '--no-error-on-unmatched-pattern',
        'lib/',
        'app/api/',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return out;
  } catch (err) {
    // ESLint exits non-zero when warnings are present even with --no-error-on-unmatched-pattern;
    // we still want the stdout it produced.
    return (err.stdout ?? '') + (err.stderr ?? '');
  }
}

function countRuleHits(output) {
  const lines = output.split('\n');
  let count = 0;
  for (const line of lines) {
    if (line.includes(RULE)) count++;
  }
  return count;
}

function main() {
  const output = runLint();
  const count = countRuleHits(output);

  console.log(`tenant-isolation lint warnings: ${count} (baseline ${BASELINE})`);

  if (count > BASELINE) {
    console.error('');
    console.error(`✗ Tenant-isolation ratchet exceeded.`);
    console.error(`  Expected ≤ ${BASELINE} warnings, found ${count}.`);
    console.error('');
    console.error('  Either:');
    console.error('    1. Migrate the new call site to createSupabaseOrgClient(orgId)');
    console.error("       (from @/lib/supabase/org-scoped), or");
    console.error('    2. If access is intentionally cross-tenant (cron / executive rollup /');
    console.error('       billing reconciliation), add an `eslint-disable-next-line');
    console.error('       formaos/no-admin-client-with-org-filter` with a justifying comment.');
    console.error('');
    console.error('  Run `npm run lint:tenant-isolation` to see the full punch list.');
    process.exit(1);
  }

  if (count < BASELINE) {
    console.log('');
    console.log(`✓ Count dropped below baseline.`);
    console.log(`  Lower BASELINE in scripts/check-tenant-isolation-ratchet.mjs`);
    console.log(`  from ${BASELINE} to ${count} in this PR to lock in the gain.`);
  } else {
    console.log('✓ Tenant-isolation ratchet held.');
  }
}

main();
