#!/usr/bin/env node
/**
 * RLS guard: fail CI if any new migration introduces an RLS policy
 * keyed off `current_setting('app.*')`.
 *
 * Background: between 2026-04 and 2026-06, four migrations created
 * 14 policies whose USING/CHECK clauses called
 *   current_setting('app.current_org_id', true)::uuid
 * but no code path ever called `set_config('app.current_org_id', ...)`.
 * The result was that those tables were closed to session callers for
 * ~14 months; only service_role worked. Migration 20260623002 fixed
 * the policies. This guard prevents the pattern from regressing.
 *
 * Allowlisted (historical) files:
 *   - 20260402001_analytics_snapshots.sql
 *   - 20260402002_auditor_portal.sql
 *   - 20260402003_care_goals.sql
 *   - 20260402009_search_index.sql
 *   - 20260623002_fix_org_guc_rls.sql (the FIX, references the pattern
 *     in DROP POLICY statements and in comments)
 *
 * Anything else is rejected.
 *
 * Usage: `node scripts/check-rls-current-setting.mjs`
 * Exits 0 on clean, 1 on violation.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations');

const ALLOWLIST = new Set([
  '20260402001_analytics_snapshots.sql',
  '20260402002_auditor_portal.sql',
  '20260402003_care_goals.sql',
  '20260402009_search_index.sql',
  '20260623002_fix_org_guc_rls.sql',
]);

// Match `current_setting('app.<anything>')` regardless of quoting style
// or whitespace. The pattern shows up in policy bodies as
//   (current_setting('app.current_org_id', true))::uuid
// and we want to catch any future variant — different setting names,
// missing cast, etc.
const PATTERN = /current_setting\s*\(\s*'app\./i;

function stripComments(sql) {
  // Drop -- single-line comments and /* block */ comments before
  // searching, so a future migration that documents the historical bug
  // in its preamble isn't flagged.
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
}

let files;
try {
  files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
} catch (err) {
  console.error(`[check-rls-current-setting] cannot read ${MIGRATIONS_DIR}:`, err.message);
  process.exit(1);
}

const violations = [];

for (const file of files) {
  if (ALLOWLIST.has(file)) continue;
  const full = path.join(MIGRATIONS_DIR, file);
  const raw = readFileSync(full, 'utf-8');
  const stripped = stripComments(raw);
  if (PATTERN.test(stripped)) {
    // Recover line numbers from the original file (not stripped).
    const lines = raw.split('\n');
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
      const lineNoComment = lines[i].replace(/--.*$/, '');
      if (PATTERN.test(lineNoComment)) hits.push(i + 1);
    }
    violations.push({ file, lines: hits });
  }
}

if (violations.length > 0) {
  console.error(
    '\n[check-rls-current-setting] FAIL: new migrations introduce ' +
      "current_setting('app.*') in policy bodies. This pattern was the " +
      'root cause of the 14-month silent RLS lockout fixed by ' +
      '20260623002_fix_org_guc_rls.sql.\n',
  );
  for (const v of violations) {
    console.error(`  ${v.file}: line(s) ${v.lines.join(', ')}`);
  }
  console.error(
    '\nFix: replace the USING/CHECK clause with a check against ' +
      "`auth.uid()` and an EXISTS over org_members. If you genuinely " +
      'need the GUC pattern, set the GUC in a SECURITY DEFINER ' +
      'function and update the ALLOWLIST in this script.\n',
  );
  process.exit(1);
}

console.log(
  `[check-rls-current-setting] OK: ${files.length} migrations scanned, ` +
    `${ALLOWLIST.size} allowlisted, 0 violations.`,
);
