#!/usr/bin/env node

// Audit 2026-05-27 — CI gate: SECURITY DEFINER functions in public must
// NOT be executable by anon or authenticated unless explicitly
// allowlisted. Supabase auto-grants EXECUTE on every public function
// via default privileges; a REVOKE ALL FROM PUBLIC at CREATE-time
// does NOT remove the explicit anon/authenticated grants. This script
// catches the drift on every PR.
//
// Drift pattern that this catches:
//   1. New SECURITY DEFINER function created.
//   2. Migration does REVOKE ALL FROM PUBLIC + GRANT TO service_role.
//   3. Supabase default privileges silently re-grant EXECUTE to anon
//      + authenticated.
//   4. Function is now callable over /rest/v1/rpc/* by anonymous users.
//
// Each finding has a fix recipe — REVOKE EXECUTE FROM anon, authenticated.
//
// Allowlist file: scripts/.security-definer-rpc-allowlist.json
// Add entries when a function is intentionally exposed (e.g. accept_invite
// is callable by anon as part of the onboarding flow — that's expected,
// not a finding).

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'node:fs';

config({ path: '.env.local' });

const ALLOWLIST_PATH = 'scripts/.security-definer-rpc-allowlist.json';

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

if (!supabaseUrl || !serviceRoleKey) {
  console.log(
    'ℹ️  Skipping SECURITY DEFINER grants check — no Supabase service credentials in env.',
  );
  process.exit(0);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let allowlist = { allowed: [] };
if (existsSync(ALLOWLIST_PATH)) {
  try {
    allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
  } catch (err) {
    console.error(`Failed to read ${ALLOWLIST_PATH}: ${err.message}`);
    process.exit(2);
  }
}

const allowedSet = new Set(allowlist.allowed ?? []);

// Use a service-role-only RPC to surface SECDEF function grants. Add
// one if we need finer queries; for now PostgREST's standard schema
// inspection through a SECURITY DEFINER RPC isn't exposed, so we'll
// rely on a sentinel approach: ask the DB to list functions where
// anon or authenticated has EXECUTE.
const { data, error } = await admin.rpc('list_security_definer_anon_grants');
if (error) {
  console.error(`RPC failed: ${error.message}`);
  console.error('Did migration 20260624061 apply? (adds list_security_definer_anon_grants RPC)');
  process.exit(2);
}

const findings = (data ?? []).filter((row) => !allowedSet.has(row.function_name));

if (findings.length === 0) {
  console.log('✓ No SECURITY DEFINER drift — every SECDEF function is either allow-listed or properly locked down.');
  process.exit(0);
}

console.error('❌ Security DEFINER drift — these functions are callable by anon/authenticated but NOT in the allowlist:');
console.error('');
for (const row of findings) {
  console.error(`  ${row.function_name}(${row.argument_signature})`);
  console.error(`    anon=${row.anon_can_execute}  authenticated=${row.authenticated_can_execute}`);
}
console.error('');
console.error('To fix each:');
console.error('  REVOKE EXECUTE ON FUNCTION public.<name>(<sig>) FROM anon, authenticated, PUBLIC;');
console.error('');
console.error(`OR add to ${ALLOWLIST_PATH} if intentional (e.g. anon-callable onboarding RPC).`);
process.exit(1);
