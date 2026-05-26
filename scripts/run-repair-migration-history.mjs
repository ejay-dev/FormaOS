#!/usr/bin/env node

// Audit 2026-05-26 — migration-history repair helper.
//
// Implements steps 1-3 of docs/operations/migration-history-repair.md
// automatically, with --dry-run by default so the operator can inspect
// what would happen before committing.
//
// USAGE:
//   node scripts/repair-migration-history.mjs            # dry-run, prints plan
//   node scripts/repair-migration-history.mjs --execute  # actually runs it
//
// Reads:
//   - Local files under supabase/migrations/
//   - Production migrations list via `supabase migration list --linked`
//
// Writes (only with --execute):
//   - supabase/migrations/00000000000000_consolidated_baseline.sql
//   - One `migration repair --status applied <version>` per historical file
//
// NEVER writes to the production data tables. Never runs DDL.
//
// Prereqs:
//   - .env.local with SUPABASE_ACCESS_TOKEN and the project linked
//   - npx supabase --version >= 1.187

import { execSync } from 'node:child_process';
import { readdirSync, existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');

const args = new Set(process.argv.slice(2));
const EXECUTE = args.has('--execute');
const MODE = EXECUTE ? 'EXECUTE' : 'DRY-RUN';

// CRITICAL CUTOFF: any local migration with version > CUTOFF is treated as
// NEW (will not be marked applied; remains for `supabase db push` to run).
// Versions ≤ CUTOFF are treated as historical (applied out-of-band; will
// be marked applied so their DDL doesn't re-run).
//
// As of 2026-05-26 audit, the last historical migration is
// 20260624029_audit_2026_05_25_orgs_sync_delete_symmetry.sql which
// corresponds to prod-recorded version 20260525093020. Files
// 20260624030–20260624043 are the NEW unapplied audit migrations and
// MUST be applied via db push — never marked applied here.
//
// If you add a new historical migration in the future, update this
// constant before running --execute, OR pass --cutoff <version> on the CLI.
const HISTORICAL_CUTOFF =
  [...args].find((a) => a.startsWith('--cutoff='))?.split('=')[1] ??
  '20260624029';

console.log(`[repair] mode: ${MODE}`);
console.log(`[repair] migrations dir: ${MIGRATIONS_DIR}`);

function run(cmd, opts = {}) {
  console.log(`[repair] $ ${cmd}`);
  if (!EXECUTE && opts.requiresExecute) {
    console.log('[repair]   (skipped in dry-run)');
    return '';
  }
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', ...opts });
}

// ---------------------------------------------------------------------------
// Step 0: Inventory.
// ---------------------------------------------------------------------------

const localFiles = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

// version = digits before first `_`
function versionOf(filename) {
  const m = filename.match(/^(\d+)/);
  return m ? m[1] : null;
}

const localVersions = new Set(
  localFiles
    .map((f) => versionOf(f))
    .filter((v) => v !== null && v !== '00000000000000'),
);

console.log(`[repair] local migration files: ${localFiles.length}`);
console.log(`[repair] distinct local versions: ${localVersions.size}`);

// Query Supabase for recorded migrations.
let recordedVersions = new Set();
try {
  const out = run('npx supabase migration list --linked --output json');
  const parsed = JSON.parse(out);
  for (const row of parsed?.migrations ?? []) {
    if (row.version) recordedVersions.add(String(row.version));
  }
} catch {
  console.warn(
    '[repair] migration list returned non-JSON output; falling back to text parse',
  );
  // The text output has three pipe-separated columns: Local | Remote | Time.
  // We only want the Remote column (col 2) — picking up Local would
  // double-count and falsely suppress versions that actually need marking.
  const text = run('npx supabase migration list --linked');
  for (const line of text.split('\n')) {
    if (!line.includes('|')) continue;
    const cols = line.split('|');
    if (cols.length < 3) continue;
    const remote = cols[1].trim();
    if (/^\d+$/.test(remote)) recordedVersions.add(remote);
  }
}
console.log(`[repair] migrations recorded in prod: ${recordedVersions.size}`);

const toMarkApplied = [...localVersions]
  .filter((v) => !recordedVersions.has(v))
  .filter((v) => v <= HISTORICAL_CUTOFF);

const skippedAsNew = [...localVersions]
  .filter((v) => !recordedVersions.has(v))
  .filter((v) => v > HISTORICAL_CUTOFF);

console.log(`[repair] historical cutoff: ${HISTORICAL_CUTOFF}`);
console.log(`[repair] versions that need marking applied: ${toMarkApplied.length}`);
console.log(`[repair] versions kept UNAPPLIED for db push (newer than cutoff): ${skippedAsNew.length}`);
if (skippedAsNew.length > 0) {
  console.log(`[repair]   NEW migrations (will RUN, not mark applied):`);
  for (const v of skippedAsNew) {
    console.log(`[repair]     - ${v}`);
  }
}

if (toMarkApplied.length === 0 && existsSync(path.join(MIGRATIONS_DIR, '00000000000000_consolidated_baseline.sql'))) {
  console.log('[repair] nothing to do — history already consistent.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Step 1: Revert the prod-recorded versions whose names don't match any
// local file. These are bookkeeping rows with timestamps that the team
// later renumbered to versioned `20260624xxx_<name>.sql` files. The DDL
// was applied — we're just clearing the now-aliased records so the
// rename in Step 2 can take effect without violating CLI consistency.
// ---------------------------------------------------------------------------

const toRevert = [...recordedVersions].filter((v) => !localVersions.has(v));
console.log(
  `[repair] Step 1: reverting ${toRevert.length} prod-recorded versions that have no matching local file`,
);
let stepCounter = 0;
for (const version of toRevert) {
  stepCounter += 1;
  const progress = `(${stepCounter}/${toRevert.length})`;
  if (EXECUTE) {
    try {
      run(
        `npx supabase migration repair --status reverted ${version} --linked`,
        { requiresExecute: true, stdio: 'pipe' },
      );
      console.log(`[repair]   ${progress} reverted ${version} ✓`);
    } catch (err) {
      console.error(`[repair]   ${progress} ${version} FAILED — ${err.message}`);
      console.error('[repair]   Halting. Investigate then re-run.');
      process.exit(1);
    }
  } else {
    console.log(`[repair]   ${progress} would revert: ${version}`);
  }
}

// ---------------------------------------------------------------------------
// Step 2: Mark every historical local migration as applied. After Step 1
// the supabase_migrations table is "empty" of the aliases; this step
// catches it up to reflect the actual deployed schema.
// ---------------------------------------------------------------------------

console.log(`[repair] Step 2: marking ${toMarkApplied.length} local versions as applied`);
stepCounter = 0;
for (const version of toMarkApplied) {
  stepCounter += 1;
  const progress = `(${stepCounter}/${toMarkApplied.length})`;
  if (EXECUTE) {
    try {
      run(`npx supabase migration repair --status applied ${version} --linked`, {
        requiresExecute: true,
        stdio: 'pipe',
      });
      console.log(`[repair]   ${progress} ${version} ✓`);
    } catch (err) {
      console.error(
        `[repair]   ${progress} ${version} FAILED — ${err.message}`,
      );
      console.error(
        '[repair]   Halting. Investigate the failing version, then re-run.',
      );
      process.exit(1);
    }
  } else {
    console.log(`[repair]   ${progress} would mark applied: ${version}`);
  }
}

// ---------------------------------------------------------------------------
// Step 3: Capture production schema (consolidated baseline).
//
// Now that history is consistent, db pull will succeed. The baseline file
// captures the cumulative effect of every applied migration so that fresh
// dev branches can be created without replaying 200+ historical files.
// ---------------------------------------------------------------------------

const BASELINE_FILE = path.join(
  MIGRATIONS_DIR,
  '00000000000000_consolidated_baseline.sql',
);

if (existsSync(BASELINE_FILE)) {
  console.log('[repair] consolidated baseline already exists; skipping Step 3');
} else {
  console.log('[repair] Step 3: dumping production schema');
  if (EXECUTE) {
    const beforeSet = new Set(readdirSync(MIGRATIONS_DIR));
    run('npx supabase db pull --schema public --linked', { requiresExecute: true });
    const afterSet = readdirSync(MIGRATIONS_DIR);
    const newOne = afterSet.find((f) => !beforeSet.has(f));
    if (!newOne) {
      console.warn(
        '[repair] db pull did not produce a new migration file. ' +
          'Schema may have been unchanged or pull skipped. Continuing.',
      );
    } else {
      renameSync(
        path.join(MIGRATIONS_DIR, newOne),
        BASELINE_FILE,
      );
      console.log(
        `[repair]   renamed ${newOne} → 00000000000000_consolidated_baseline.sql`,
      );
    }
  }
}

// Also mark the consolidated baseline as applied (it represents the live state).
if (EXECUTE && existsSync(BASELINE_FILE)) {
  try {
    run('npx supabase migration repair --status applied 00000000000000 --linked', {
      requiresExecute: true,
      stdio: 'pipe',
    });
    console.log('[repair] baseline marker recorded');
  } catch (err) {
    console.warn(
      '[repair] could not mark baseline applied (may already exist): ' +
        err.message.split('\n')[0],
    );
  }
}

// ---------------------------------------------------------------------------
// Done.
// ---------------------------------------------------------------------------

console.log('');
console.log('[repair] done.');
if (!EXECUTE) {
  console.log(
    '[repair] dry-run only. Re-run with --execute to actually apply the repair.',
  );
} else {
  console.log(
    '[repair] Verify by running: npx supabase migration list --linked',
  );
  console.log(
    '[repair] Then try creating a dev branch — it should now succeed.',
  );
}
