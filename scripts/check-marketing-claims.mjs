#!/usr/bin/env node
/**
 * CI guard: fail when lib/marketing/claims.generated.ts is stale, i.e.
 * a framework pack, the pack registry, or evaluator coverage changed
 * without `npm run claims:rehash`.
 *
 * Public copy imports these constants, so a stale file means the
 * marketing site is quoting numbers the product no longer ships.
 */
import { readFileSync } from 'node:fs';
import {
  expectedClaimsSource,
  claimsOutputPath,
  claimTotals,
} from './build-marketing-claims.mjs';

let actual;
try {
  actual = readFileSync(claimsOutputPath, 'utf8');
} catch {
  console.error(
    '[marketing-claims] lib/marketing/claims.generated.ts is missing. Run `npm run claims:rehash`.',
  );
  process.exit(1);
}

if (actual !== expectedClaimsSource) {
  console.error(
    '[marketing-claims] lib/marketing/claims.generated.ts is out of date.\n' +
      `  Sources now imply: ${claimTotals.packCount} packs, ${claimTotals.controlCount} controls, ` +
      `${claimTotals.evaluatorCount} evaluators (${claimTotals.automatedEvaluatorCount} automated / ` +
      `${claimTotals.manualAttestationCount} manual).\n` +
      '  Run `npm run claims:rehash` and commit the result.',
  );
  process.exit(1);
}

console.log(
  `[marketing-claims] OK: ${claimTotals.packCount} packs, ${claimTotals.controlCount} controls, ` +
    `${claimTotals.evaluatorCount} evaluators ` +
    `(${claimTotals.automatedEvaluatorCount} automated / ${claimTotals.manualAttestationCount} manual).`,
);
