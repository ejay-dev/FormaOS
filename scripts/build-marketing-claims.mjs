#!/usr/bin/env node
/**
 * Regenerate lib/marketing/claims.generated.ts from the real product
 * sources, so public-facing numbers cannot drift from what ships.
 *
 * Before this existed, the same claim appeared with different values on
 * different pages ("7+", "8" and "9" framework packs; 61 vs 64 SOC 2
 * controls; "252 total controls" beside a table summing to 634). For a
 * product whose pitch is verifiable compliance, arithmetic a buyer can
 * disprove in two page loads is the worst possible failure mode.
 *
 * Sources of truth:
 *   - lib/frameworks/pack-registry.ts  -> which packs orgs can install
 *   - framework-packs/<file>.json      -> controls per pack
 *   - lib/compliance/evaluators/<slug> -> evaluators, automated vs manual
 *
 * Run after changing any of the above: `npm run claims:rehash`.
 * CI verifies freshness via scripts/check-marketing-claims.mjs.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'lib', 'frameworks', 'pack-registry.ts');
const PACKS_DIR = path.join(ROOT, 'framework-packs');
const EVALUATORS_DIR = path.join(ROOT, 'lib', 'compliance', 'evaluators');
const OUT = path.join(ROOT, 'lib', 'marketing', 'claims.generated.ts');

/**
 * An evaluator counts as "manual attestation" when it is built from the
 * manual helper rather than a database predicate. Mirrors the two spellings
 * used across evaluator families.
 */
const MANUAL_MARKER = /manualAttestation|makeManualEvaluator/;

/** Parse PACK_REGISTRY entries without importing TypeScript. */
function readPackRegistry() {
  const source = readFileSync(REGISTRY, 'utf8');
  const block = source.slice(
    source.indexOf('export const PACK_REGISTRY'),
    source.indexOf('export function getFrameworkCodeForSlug'),
  );
  const entries = [];
  const re =
    /slug:\s*'([^']+)'\s*,\s*(?:\n\s*)?file:\s*'([^']+)'\s*,\s*(?:\n\s*)?code:\s*'([^']+)'/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    entries.push({ slug: match[1], file: match[2], code: match[3] });
  }
  if (!entries.length) {
    throw new Error(
      'build-marketing-claims: parsed 0 packs from pack-registry.ts — the registry shape changed, update this parser.',
    );
  }
  return entries;
}

function readPack(file) {
  const raw = JSON.parse(readFileSync(path.join(PACKS_DIR, file), 'utf8'));
  const controls = Array.isArray(raw.controls) ? raw.controls : [];
  return {
    name: raw.framework?.name ?? raw.name ?? file.replace(/\.json$/, ''),
    version: raw.framework?.version ?? null,
    controlCount: controls.length,
  };
}

function countEvaluators(slug) {
  let dir;
  try {
    dir = readdirSync(path.join(EVALUATORS_DIR, slug));
  } catch {
    return { total: 0, automated: 0, manual: 0 };
  }
  const files = dir.filter((n) => n.endsWith('.ts') && !n.startsWith('_'));
  let manual = 0;
  for (const name of files) {
    const body = readFileSync(path.join(EVALUATORS_DIR, slug, name), 'utf8');
    if (MANUAL_MARKER.test(body)) manual += 1;
  }
  return { total: files.length, automated: files.length - manual, manual };
}

const packs = readPackRegistry().map((entry) => {
  const pack = readPack(entry.file);
  const evaluators = countEvaluators(entry.slug);
  return {
    slug: entry.slug,
    code: entry.code,
    name: pack.name,
    version: pack.version,
    controlCount: pack.controlCount,
    evaluatorCount: evaluators.total,
    automatedEvaluatorCount: evaluators.automated,
    manualAttestationCount: evaluators.manual,
  };
});

const sum = (key) => packs.reduce((total, pack) => total + pack[key], 0);

const totals = {
  packCount: packs.length,
  controlCount: sum('controlCount'),
  evaluatorCount: sum('evaluatorCount'),
  automatedEvaluatorCount: sum('automatedEvaluatorCount'),
  manualAttestationCount: sum('manualAttestationCount'),
};

const banner = `// GENERATED FILE — do not edit by hand.
// Run \`npm run claims:rehash\` after changing framework packs, the pack
// registry, or evaluator coverage. CI enforces freshness via
// \`npm run check:claims\`.
//
// Every number here is derived from shipping code, so public copy that
// imports it cannot claim more (or less) than the product delivers.
`;

const body = `${banner}
export type FrameworkPackClaim = {
  /** Pack slug as installed (matches PACK_REGISTRY). */
  slug: string;
  /** Database framework code. */
  code: string;
  /** Human name exactly as the pack declares it. */
  name: string;
  /** Framework version/edition, when the pack declares one. */
  version: string | null;
  /** Controls defined in the pack file. */
  controlCount: number;
  /** Evaluators wired in lib/compliance/evaluators/<slug>. */
  evaluatorCount: number;
  /** Evaluators backed by a database signal. */
  automatedEvaluatorCount: number;
  /** Evaluators that require a human attestation. */
  manualAttestationCount: number;
};

export const FRAMEWORK_PACKS: readonly FrameworkPackClaim[] = ${JSON.stringify(
  packs,
  null,
  2,
)} as const;

/** Framework packs an organisation can install today. */
export const FRAMEWORK_PACK_COUNT = ${totals.packCount};

/** Controls defined across every installable pack. */
export const FRAMEWORK_CONTROL_COUNT = ${totals.controlCount};

/** Control evaluators registered in code. */
export const EVALUATOR_COUNT = ${totals.evaluatorCount};

/** Evaluators that read a database signal rather than asking a human. */
export const AUTOMATED_EVALUATOR_COUNT = ${totals.automatedEvaluatorCount};

/** Evaluators that require a human attestation. */
export const MANUAL_ATTESTATION_COUNT = ${totals.manualAttestationCount};
`;

/** The file contents the current sources imply. Used by the CI freshness check. */
export const expectedClaimsSource = body;
export const claimsOutputPath = OUT;
export const claimTotals = totals;

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  writeFileSync(OUT, body);
  console.log(
    `[marketing-claims] claims.generated.ts rebuilt — ${totals.packCount} packs, ` +
      `${totals.controlCount} controls, ${totals.evaluatorCount} evaluators ` +
      `(${totals.automatedEvaluatorCount} automated / ${totals.manualAttestationCount} manual).`,
  );
}
