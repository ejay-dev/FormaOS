#!/usr/bin/env node

/**
 * Behavioural tenant-isolation gate (audit 2026-08-02).
 *
 * scripts/check-supabase-rls-contracts.mjs checks that RLS is enabled and that
 * policies exist. It passed green throughout the period production was leaking
 * 2,410 org_members rows across 2,309 organisations, because a policy that is
 * present and permissive looks identical, in the catalog, to one that is present
 * and correct. Supabase's own security advisor missed the same defect.
 *
 * This gate asserts BEHAVIOUR instead: it authenticates as a real single-org
 * user, per role, and counts how many organisations each org-scoped table
 * actually returns. More than one is a leak. A policy that raises instead of
 * returning false is also a failure — team_invitations was doing that (it read
 * auth.users, which `authenticated` cannot select), which broke every
 * client-side read of the table while looking perfectly healthy in the catalog.
 *
 * The impersonation happens inside _audit_tenant_isolation_probe()
 * (migration 20260803003), which is granted to service_role only.
 */

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

config({ path: '.env.local' });

const clean = (value) => (value || '').trim().replace(/^['"]|['"]$/g, '');

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);
const reportPath = path.join(
  process.cwd(),
  'artifacts',
  'qa',
  'tenant-isolation-behaviour.json',
);

function writeReport(payload) {
  try {
    mkdirSync(path.dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(payload, null, 2));
  } catch {
    // Report writing is best-effort; the exit code is the contract.
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'SKIP tenant-isolation-behaviour: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.',
  );
  writeReport({ status: 'skipped', reason: 'missing credentials' });
  // Deliberately not a hard failure: local runs without service credentials
  // should not block. CI supplies both, so the gate is enforced there.
  process.exit(0);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin.rpc('_audit_tenant_isolation_probe');

if (error) {
  console.error(`FAIL tenant-isolation probe could not run: ${error.message}`);
  if (error.message?.includes('does not exist')) {
    console.error(
      '     Apply migration 20260803003_audit_2026_08_02_tenant_isolation_probe.sql.',
    );
  }
  writeReport({ status: 'error', error: error.message });
  process.exit(1);
}

const rows = data ?? [];
if (rows.length === 0) {
  console.error(
    'FAIL tenant-isolation probe returned no rows — it found no single-org probe user, so nothing was actually verified.',
  );
  writeReport({ status: 'error', reason: 'no probe rows' });
  process.exit(1);
}

const leaks = rows.filter((r) => r.verdict === 'LEAK');
const errors = rows.filter((r) => String(r.verdict).startsWith('ERROR'));
const rolesProbed = [...new Set(rows.map((r) => r.probe_role))];
const tablesProbed = new Set(rows.map((r) => r.table_name)).size;

for (const row of leaks) {
  console.error(
    `FAIL cross-tenant read: ${row.table_name} (${row.org_column}) returned ${row.visible_orgs} organisations to a single-org ${row.probe_role}`,
  );
}
for (const row of errors) {
  console.error(
    `FAIL policy raises instead of filtering: ${row.table_name} as ${row.probe_role} — ${row.verdict}`,
  );
}

writeReport({
  status: leaks.length === 0 && errors.length === 0 ? 'pass' : 'fail',
  rolesProbed,
  tablesProbed,
  checks: rows.length,
  leaks,
  errors,
});

if (leaks.length > 0 || errors.length > 0) {
  console.error(
    `\nFAIL ${leaks.length} leaking table(s), ${errors.length} erroring policy(s) across roles [${rolesProbed.join(', ')}].`,
  );
  process.exit(1);
}

console.log(
  `PASS tenant isolation: ${tablesProbed} org-scoped tables x roles [${rolesProbed.join(', ')}] = ${rows.length} checks, 0 leaks, 0 policy errors.`,
);
