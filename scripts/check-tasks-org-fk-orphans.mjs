#!/usr/bin/env node

// Audit 2026-05-26 — P0-6 / P0-7 dry-run.
//
// Counts the rows that would block migration
// 20260624046_audit_2026_05_26_tasks_and_compliance_status_fks.sql:
//
//   * public.tasks rows with NULL organization_id
//   * public.tasks rows whose organization_id has no matching organizations row
//   * public.org_compliance_status rows whose organization_id has no matching
//     organizations row
//
// Run BEFORE applying the migration so you know whether it will succeed.
// Exits 0 with counts printed; exits 1 only when Supabase credentials are
// missing.
//
//   node scripts/check-tasks-org-fk-orphans.mjs

import { createRequire } from 'module';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Supabase JS eagerly instantiates RealtimeClient which needs a global
// WebSocket. Node 20 (the project's engines.node) doesn't ship one, so
// require it here as `ws` (a transitive dep of supabase-js) before any
// createClient call. Node 22+ already has native WebSocket and ignores
// this assignment.
const localRequire = createRequire(import.meta.url);
if (typeof globalThis.WebSocket === 'undefined') {
  try {
    globalThis.WebSocket = localRequire('ws');
  } catch {
    // No-op: if `ws` isn't resolvable, createClient below will throw a
    // clearer error than we can.
  }
}

config({ path: '.env.local' });

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'No Supabase service credentials in env (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). Skipping.',
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function countTasksNullOrg() {
  const { count, error } = await admin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .is('organization_id', null);
  if (error) throw error;
  return count ?? 0;
}

async function countOrphanTasks() {
  // Two-step: read all task organization_ids, then read the org id set.
  // For very large tables, switch to a server-side RPC; for the expected
  // dataset (operator dry-run) this is fine.
  const [{ data: taskRows, error: e1 }, { data: orgRows, error: e2 }] =
    await Promise.all([
      admin
        .from('tasks')
        .select('organization_id')
        .not('organization_id', 'is', null),
      admin.from('organizations').select('id'),
    ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const orgIds = new Set((orgRows ?? []).map((r) => r.id));
  return (taskRows ?? []).filter((r) => !orgIds.has(r.organization_id)).length;
}

async function countOrphanComplianceStatus() {
  const [{ data: statusRows, error: e1 }, { data: orgRows, error: e2 }] =
    await Promise.all([
      admin.from('org_compliance_status').select('organization_id'),
      admin.from('organizations').select('id'),
    ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const orgIds = new Set((orgRows ?? []).map((r) => r.id));
  return (statusRows ?? []).filter((r) => !orgIds.has(r.organization_id))
    .length;
}

async function main() {
  const [nullTasks, orphanTasks, orphanStatus] = await Promise.all([
    countTasksNullOrg(),
    countOrphanTasks(),
    countOrphanComplianceStatus(),
  ]);

  console.log('tasks.organization_id IS NULL                       :', nullTasks);
  console.log('tasks.organization_id orphan (no parent org)        :', orphanTasks);
  console.log('org_compliance_status orphan (no parent org)        :', orphanStatus);

  const total = nullTasks + orphanTasks + orphanStatus;
  if (total === 0) {
    console.log('✅ Migration 20260624046 will apply cleanly.');
    process.exit(0);
  }

  console.log(
    `⚠️  ${total} row(s) would block migration 20260624046. Clean them before applying — see the comment block at the top of the migration for the preview queries.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('check-tasks-org-fk-orphans failed:', err);
  process.exit(2);
});
