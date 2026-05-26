#!/usr/bin/env node

// Audit 2026-05-26 — FK index coverage check.
//
// Connects to the configured Supabase database and asserts that every
// FOREIGN KEY on a single column in the `public` schema has an index
// whose leading key matches the FK column. Used as a CI gate after
// migration 20260624043 backfilled the historical gaps.
//
// Exit codes:
//   0 — every single-column FK is index-covered.
//   1 — one or more FKs are uncovered (printed list with table + column).
//   2 — script could not connect or query (env missing, network, etc.).
//
// Skips multi-column FKs since they need only an index on the leading
// prefix, which the heuristic check below does not model accurately.
// A follow-up can extend the SQL to validate multi-column FKs too.

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'check-fk-indexes: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local',
  );
  process.exit(2);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// One round-trip to the database via the existing _audit_rls_status pattern
// is preferred for parity with check-supabase-rls-contracts.mjs, but the
// query below is read-only and uses pg_constraint / pg_indexes directly via
// the `exec_sql` RPC commonly added to FormaOS for diagnostic scripts. If
// `exec_sql` is not available in your environment, run the SQL block
// inside the migration file's top comment directly in SQL Editor instead.

const sql = `
WITH fk_columns AS (
  SELECT
    c.conrelid::regclass::text AS table_name,
    a.attname AS column_name,
    c.conname
  FROM pg_constraint c
  JOIN pg_attribute a
    ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
  WHERE c.contype = 'f'
    AND c.connamespace = 'public'::regnamespace
    AND array_length(c.conkey, 1) = 1
)
SELECT fk.table_name, fk.column_name, fk.conname
FROM fk_columns fk
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
    AND ('public.' || i.tablename) = fk.table_name
    AND (
      i.indexdef LIKE '%(' || fk.column_name || ')%'
      OR i.indexdef LIKE '%(' || fk.column_name || ',%'
    )
)
ORDER BY fk.table_name, fk.column_name;
`;

let rows;
try {
  const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql });
  if (error) throw error;
  rows = Array.isArray(data) ? data : [];
} catch (err) {
  console.error(
    'check-fk-indexes: could not execute discovery query.',
    err?.message ?? err,
  );
  console.error(
    'If your project lacks the exec_sql RPC, run the inline SQL inside the migration file directly in SQL Editor.',
  );
  process.exit(2);
}

if (rows.length === 0) {
  console.log('check-fk-indexes: every single-column FK in public is index-covered.');
  process.exit(0);
}

console.error('check-fk-indexes: the following FKs are missing an index on the FK column:');
for (const row of rows) {
  console.error(`  - ${row.table_name}.${row.column_name}  (constraint: ${row.conname})`);
}
console.error('');
console.error('Add a matching CREATE INDEX in a new migration. Example:');
console.error('');
console.error(
  '  CREATE INDEX IF NOT EXISTS idx_<table>_<column> ON public.<table> (<column>);',
);
process.exit(1);
