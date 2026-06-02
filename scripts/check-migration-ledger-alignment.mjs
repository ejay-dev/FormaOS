#!/usr/bin/env node

// Audit 2026-05-27 (R6) — alignment check between supabase/migrations/
// filesystem and a committed snapshot of supabase_migrations.schema_migrations.
//
// Background: the `mcp__claude_ai_Supabase__apply_migration` tool records
// ledger entries under a synthetic CLI-style timestamp (`YYYYMMDDhhmmss`)
// rather than the filesystem's audit-cycle prefix (`YYYYMMDDnnn`). Without
// a reconciliation, `supabase migration list --linked` sees the same migration
// as both "local only" and "remote only" and blocks `supabase create-branch`.
//
// This script doesn't talk to prod — it diffs the FS against
// `supabase/.migration-ledger-snapshot.json`, refreshed by running
// `npm run db:ledger:snapshot` against the live DB (operator action). That
// way the check works in fork PRs without DB credentials, while the snapshot
// catches drift on every PR.
//
// Categories reported (see docs/operations/migration-history-repair.md):
//   1. Aligned: FS prefix matches a ledger version.
//   2. Drifted: FS name matches a ledger entry under a different version
//      (the synthetic-timestamp pattern — schema is correct, bookkeeping diverges).
//   3. FS-only documented-skip: file documents itself with "STATUS: SKIPPED".
//   4. FS-only unexplained: file exists, no ledger trace, no skip marker. FAIL.
//   5. Ledger-only: ledger row with no FS source. FAIL.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const MIGRATIONS_DIR = 'supabase/migrations';
const SNAPSHOT_PATH = 'supabase/.migration-ledger-snapshot.json';

if (!existsSync(SNAPSHOT_PATH)) {
  // The snapshot is committed to the repo, so it is present in every real
  // checkout — including fork PRs. A missing snapshot in CI therefore means
  // it was deleted/not committed, which would silently turn this drift gate
  // into a no-op. Fail in CI; only tolerate the absence for fresh local setup.
  if (process.env.CI) {
    console.error(
      `❌ ${SNAPSHOT_PATH} is missing in CI. The committed ledger snapshot must\n` +
        `   exist for the alignment gate to run. Restore it or regenerate via\n` +
        `   \`npm run db:ledger:snapshot\` against prod.`,
    );
    process.exit(1);
  }
  console.log(
    `ℹ️  Skipping ledger-alignment check — ${SNAPSHOT_PATH} missing.\n   Run \`npm run db:ledger:snapshot\` against prod to generate it.`,
  );
  process.exit(0);
}

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
const ledger = Array.isArray(snapshot.rows) ? snapshot.rows : [];

function parseFsFile(file) {
  const base = basename(file, '.sql');
  const underscoreAt = base.indexOf('_');
  if (underscoreAt === -1) return null;
  return {
    version: base.slice(0, underscoreAt),
    name: base.slice(underscoreAt + 1),
    file,
  };
}

function statusOf(file) {
  const head = readFileSync(join(MIGRATIONS_DIR, file), 'utf8').slice(0, 600);
  if (/STATUS:\s*SKIPPED/i.test(head)) return 'documented-skip';
  return 'expected-applied';
}

const fsFiles = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .map(parseFsFile)
  .filter(Boolean);

const ledgerByVersion = new Map(ledger.map((r) => [r.version, r]));
const ledgerByName = new Map();
for (const r of ledger) {
  if (r.name) ledgerByName.set(r.name, r);
}

const aligned = [];
const drifted = [];
const fsOnly = [];
const fsOnlyDocumentedSkip = [];

for (const fs of fsFiles) {
  if (ledgerByVersion.has(fs.version)) {
    aligned.push(fs);
    continue;
  }
  if (ledgerByName.has(fs.name)) {
    drifted.push({ ...fs, ledgerVersion: ledgerByName.get(fs.name).version });
    continue;
  }
  // 036 v1/v2: prod has the v2-renamed file recorded.
  if (ledgerByName.has(`${fs.name}_v2`)) {
    drifted.push({
      ...fs,
      ledgerVersion: ledgerByName.get(`${fs.name}_v2`).version,
      note: 'v2 applied in place of v1',
    });
    continue;
  }
  if (statusOf(fs.file) === 'documented-skip') {
    fsOnlyDocumentedSkip.push(fs);
  } else {
    fsOnly.push(fs);
  }
}

const fsVersionSet = new Set(fsFiles.map((f) => f.version));
const fsNameSet = new Set(fsFiles.map((f) => f.name));
const ledgerOnly = ledger.filter((r) => {
  if (fsVersionSet.has(r.version)) return false;
  if (r.name && fsNameSet.has(r.name)) return false;
  if (r.name && fsNameSet.has(r.name.replace(/_v2$/, ''))) return false;
  return true;
});

console.log('Migration ledger alignment');
console.log('==========================');
console.log(`Snapshot taken: ${snapshot.takenAt ?? 'unknown'}`);
console.log(`FS files:       ${fsFiles.length}`);
console.log(`Ledger rows:    ${ledger.length}`);
console.log('');
console.log(`Aligned:                          ${aligned.length}`);
console.log(`Drifted (name-match, version off): ${drifted.length}`);
console.log(`Documented-skip (no ledger row):   ${fsOnlyDocumentedSkip.length}`);
console.log(`FS-only unexplained:               ${fsOnly.length}`);
console.log(`Ledger-only (no FS source):        ${ledgerOnly.length}`);

if (drifted.length) {
  console.log(`\nDrifted (sample):`);
  for (const d of drifted.slice(0, 8)) {
    console.log(`  ${d.version} ↔ ${d.ledgerVersion}  ${d.name}${d.note ? `  (${d.note})` : ''}`);
  }
  if (drifted.length > 8) console.log(`  ... and ${drifted.length - 8} more`);
}

if (fsOnlyDocumentedSkip.length) {
  console.log(`\nDocumented-skip files (target object missing on prod):`);
  for (const f of fsOnlyDocumentedSkip) console.log(`  ${f.version}  ${f.name}`);
}

if (fsOnly.length) {
  console.log(`\n❌ FS-only unexplained:`);
  for (const f of fsOnly) console.log(`  ${f.version}  ${f.name}`);
}

if (ledgerOnly.length) {
  console.log(`\n❌ Ledger-only (no FS source):`);
  for (const r of ledgerOnly) console.log(`  ${r.version}  ${r.name ?? '(no-name)'}`);
}

const fail = fsOnly.length > 0 || ledgerOnly.length > 0;
if (fail) {
  console.log(`\n→ See docs/operations/migration-history-repair.md for remediation.`);
  process.exit(1);
}

console.log(`\n✓ Ledger alignment OK (drift entries are name-matched and benign).`);
process.exit(0);
