#!/usr/bin/env node

// Regression test for migration 20260624_001_fix_rls_drift_restore_restrictive_policies.
// Asserts the live database state matches the policy intent, so that the
// pre-fix drift (audit 2026-05-22 database-001..006 + isolation-002) cannot
// silently re-appear.
//
// Skipped when Supabase service credentials are not configured (e.g. CI on
// a fork without secrets).

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

if (!supabaseUrl || !serviceRoleKey) {
  console.log(
    'ℹ️  Skipping RLS-drift contract check — no Supabase service credentials in env.',
  );
  process.exit(0);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const failures = [];
const passes = [];

function fail(msg) {
  failures.push(msg);
  console.error(`FAIL ${msg}`);
}
function pass(msg) {
  passes.push(msg);
  console.log(`PASS ${msg}`);
}

let execSqlUnavailable = false;
async function execSql(sql) {
  const { data, error } = await admin.rpc('exec_sql', { sql });
  if (error) {
    // exec_sql is a developer-installed RPC; not every Supabase project ships
    // it. Treat "function not found" as "skip live assertions" (same posture
    // as scripts/check-supabase-rls-contracts.mjs) instead of failing CI on
    // an environment that legitimately can't run the live check.
    if (/Could not find the function|not exist|undefined function/i.test(error.message)) {
      execSqlUnavailable = true;
      return [];
    }
    throw new Error(`exec_sql failed: ${error.message}`);
  }
  return data || [];
}

// ----------------------------------------------------------------------------
// 1. The four telemetry tables must have RESTRICTIVE service_role policy +
//    block policy for non-service roles.
// ----------------------------------------------------------------------------
async function assertTelemetryPolicies() {
  const tables = ['security_events', 'security_alerts', 'active_sessions', 'user_activity'];

  const rows = await execSql(`
    select
      tablename,
      policyname,
      permissive,
      roles::text as roles,
      cmd,
      qual,
      with_check
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array['security_events','security_alerts','active_sessions','user_activity'])
    order by tablename, policyname
  `);

  for (const table of tables) {
    const tableRows = rows.filter((r) => r.tablename === table);

    // service_role policy: RESTRICTIVE, roles must include service_role only
    const svc = tableRows.find((r) => r.policyname === `${table}_service_role`);
    if (!svc) {
      fail(`${table}: no policy named "${table}_service_role" exists`);
    } else if (svc.permissive !== 'RESTRICTIVE' && svc.permissive !== false) {
      // pg_policies.permissive is 'PERMISSIVE' or 'RESTRICTIVE' (text). The
      // pre-fix drift had this set to PERMISSIVE — a regression check needs
      // to reject both 'PERMISSIVE' and the boolean-true variant.
      fail(`${table}: ${table}_service_role is ${svc.permissive}, expected RESTRICTIVE`);
    } else if (!/service_role/.test(svc.roles) || /\bpublic\b/.test(svc.roles)) {
      fail(
        `${table}: ${table}_service_role roles=${svc.roles} — must be service_role only (not public)`,
      );
    } else {
      pass(`${table}: service_role policy is RESTRICTIVE TO service_role`);
    }

    // Block policy for non-service roles
    const isUserVisibleTable = table === 'active_sessions' || table === 'user_activity';
    const expectedBlockName = isUserVisibleTable ? `${table}_block_anon` : `${table}_block_users`;
    const block = tableRows.find((r) => r.policyname === expectedBlockName);
    if (!block) {
      fail(`${table}: missing block policy "${expectedBlockName}"`);
    } else if (block.qual !== 'false' || block.with_check !== 'false') {
      fail(
        `${table}: ${expectedBlockName} qual=${block.qual} with_check=${block.with_check} — both must be false`,
      );
    } else {
      pass(`${table}: ${expectedBlockName} encodes explicit deny`);
    }

    // No leftover permissive-for-public on these tables
    const offenders = tableRows.filter(
      (r) =>
        (r.permissive === 'PERMISSIVE' || r.permissive === true) &&
        r.qual === 'true' &&
        /\bpublic\b/.test(r.roles),
    );
    if (offenders.length > 0) {
      fail(
        `${table}: ${offenders.length} PERMISSIVE policy(ies) with qual=true to role public still present: ${offenders
          .map((o) => o.policyname)
          .join(', ')}`,
      );
    } else {
      pass(`${table}: no permissive-for-public policy remains`);
    }
  }
}

// ----------------------------------------------------------------------------
// 2. storage.objects: legacy bucket-wide evidence policies must be gone.
// ----------------------------------------------------------------------------
async function assertStoragePolicies() {
  const rows = await execSql(`
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in ('Allow Evidence View', 'Allow Evidence Upload')
  `);
  if (rows.length > 0) {
    fail(
      `storage.objects still has legacy evidence policies: ${rows.map((r) => r.policyname).join(', ')}`,
    );
  } else {
    pass('storage.objects: legacy "Allow Evidence View" / "Allow Evidence Upload" policies removed');
  }

  // Sanity: the org-scoped evidence_* policies are still in place
  const scoped = await execSql(`
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'evidence_%'
    order by policyname
  `);
  const expected = ['evidence_delete', 'evidence_insert', 'evidence_select', 'evidence_update'];
  const have = scoped.map((r) => r.policyname).sort();
  const missing = expected.filter((p) => !have.includes(p));
  if (missing.length > 0) {
    fail(`storage.objects: missing org-scoped evidence policy(ies): ${missing.join(', ')}`);
  } else {
    pass('storage.objects: org-scoped evidence_{select,insert,update,delete} policies present');
  }
}

// ----------------------------------------------------------------------------
// 3. Views: risk_summary and unified_org_audit_log are SECURITY INVOKER.
// ----------------------------------------------------------------------------
async function assertViewSecurityInvoker() {
  const rows = await execSql(`
    select
      c.relname as view_name,
      coalesce(
        (select option_value
         from pg_options_to_table(c.reloptions)
         where option_name = 'security_invoker'),
        'off'
      ) as security_invoker
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and c.relname in ('risk_summary','unified_org_audit_log')
  `);

  for (const view of ['risk_summary', 'unified_org_audit_log']) {
    const row = rows.find((r) => r.view_name === view);
    if (!row) {
      // View may not exist in every environment — only fail if it does and isn't fixed.
      pass(`${view}: view does not exist in this environment (nothing to assert)`);
      continue;
    }
    if (row.security_invoker !== 'on' && row.security_invoker !== 'true') {
      fail(`view ${view}: security_invoker=${row.security_invoker}, expected on`);
    } else {
      pass(`view ${view}: SECURITY INVOKER`);
    }
  }
}

async function probeExecSql() {
  await execSql('select 1 as ok');
  return !execSqlUnavailable;
}

async function main() {
  const haveExecSql = await probeExecSql();
  if (!haveExecSql) {
    console.log(
      'ℹ️  exec_sql RPC unavailable in this Supabase project — live assertions skipped. Migration file is the source of truth.',
    );
    process.exit(0);
  }

  try {
    await assertTelemetryPolicies();
    await assertStoragePolicies();
    await assertViewSecurityInvoker();
  } catch (err) {
    fail(`unexpected: ${err.message}`);
  }

  console.log('');
  console.log(`Passed: ${passes.length}`);
  console.log(`Failed: ${failures.length}`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

await main();
