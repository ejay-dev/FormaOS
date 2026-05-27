#!/usr/bin/env node

// Audit 2026-05-27 (R6) — snapshot supabase_migrations.schema_migrations into
// supabase/.migration-ledger-snapshot.json so the lighter-weight FS-only
// alignment check (scripts/check-migration-ledger-alignment.mjs) can run on
// every PR without needing DB credentials.
//
// Why a SECURITY DEFINER RPC: PostgREST does not expose the
// supabase_migrations schema directly. Migration 20260624054 adds a
// service_role-only RPC that returns the ledger rows. This script calls it.
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the env
// (typically .env.local). Refresh cadence is operator-driven — re-run after
// any new migration is applied to keep the snapshot fresh.

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { writeFileSync } from 'node:fs';

config({ path: '.env.local' });

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env (or .env.local).');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin.rpc('list_migration_ledger');
if (error) {
  console.error(`RPC list_migration_ledger failed: ${error.message}`);
  console.error('Did migration 20260624054 apply? See docs/operations/migration-history-repair.md.');
  process.exit(1);
}

const snapshot = {
  takenAt: new Date().toISOString(),
  source: 'rpc:list_migration_ledger',
  rows: data,
};

writeFileSync('supabase/.migration-ledger-snapshot.json', JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote supabase/.migration-ledger-snapshot.json (${data.length} rows).`);
