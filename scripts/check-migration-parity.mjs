#!/usr/bin/env node

// Audit 2026-06-02 — migration parity gate.
//
// FormaOS applies migrations to prod manually (via the Supabase MCP), out of
// band from the Vercel git-integration deploy. There is no automated apply
// step, so the filesystem migration set is the source of truth that operators
// replay. This credential-free gate enforces the structural invariants that
// make that replay safe and deterministic:
//
//   1. Every migration filename carries a numeric version prefix
//      (`<digits>_<name>.sql`) — the apply order key.
//   2. No two migrations share the same version prefix — a duplicate makes
//      apply order ambiguous and can silently skip one of them.
//   3. Filenames are unique.
//
// It does NOT talk to the database. Ledger/remote drift is covered separately
// by check-migration-ledger-alignment.mjs. Deploy-gating limitations are
// documented in docs/operations/migration-history-repair.md.
//
// Run: `npm run test:db:migration-parity`

import { readdirSync } from 'node:fs';

const MIGRATIONS_DIR = 'supabase/migrations';

let files;
try {
  files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
} catch (err) {
  console.error(`❌ Could not read ${MIGRATIONS_DIR}: ${err.message}`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`❌ No .sql migrations found in ${MIGRATIONS_DIR}.`);
  process.exit(1);
}

const errors = [];
const prefixToFiles = new Map();

for (const file of files) {
  const match = /^(\d+)_/.exec(file);
  if (!match) {
    errors.push(
      `Non-conforming filename (no numeric version prefix): ${file}`,
    );
    continue;
  }
  const prefix = match[1];
  const bucket = prefixToFiles.get(prefix) ?? [];
  bucket.push(file);
  prefixToFiles.set(prefix, bucket);
}

for (const [prefix, bucket] of prefixToFiles) {
  if (bucket.length > 1) {
    errors.push(
      `Duplicate version prefix ${prefix} shared by: ${bucket.join(', ')}`,
    );
  }
}

if (errors.length > 0) {
  console.error(
    `❌ Migration parity check failed (${errors.length} issue(s)):\n`,
  );
  for (const e of errors) console.error(`  - ${e}`);
  console.error(
    `\nFix the filenames so every migration has a unique numeric version prefix.`,
  );
  process.exit(1);
}

console.log(
  `✓ Migration parity OK: ${files.length} migrations, all uniquely prefixed and well-formed.`,
);
process.exit(0);
