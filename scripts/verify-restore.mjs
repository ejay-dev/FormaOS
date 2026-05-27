#!/usr/bin/env node

// Audit 2026-05-27 — verify a PITR-restored database against a set of
// invariants, then record the outcome in public.restore_test_runs.
//
// Designed for the monthly DR drill (see docs/operations/pitr-restore-runbook.md):
//   1. Operator creates a Supabase branch restored from PITR target T.
//   2. Operator points this script at the branch's service-role URL.
//   3. Script runs invariants and writes a row to restore_test_runs on
//      PROD (not the branch) so the audit trail outlives the branch.
//
// Required env (target branch — what we're verifying):
//   TARGET_SUPABASE_URL
//   TARGET_SUPABASE_SERVICE_ROLE_KEY
//
// Required env (ledger — where we write the result):
//   NEXT_PUBLIC_SUPABASE_URL  (prod)
//   SUPABASE_SERVICE_ROLE_KEY (prod)
//
// CLI:
//   node scripts/verify-restore.mjs \
//     --performed-by "ejaz@formaos.io" \
//     --pitr-target "2026-05-27T12:00:00Z" \
//     --branch-id "abc123"

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { argv, exit } from 'node:process';

config({ path: '.env.local' });

function clean(v) {
  return (v || '').trim().replace(/^['"]|['"]$/g, '');
}

function parseArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) continue;
    const key = args[i].slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
    out[key] = value;
    if (value) i++;
  }
  return out;
}

const args = parseArgs(argv.slice(2));
const performedBy = args['performed-by'] || process.env.USER || '';
const pitrTarget = args['pitr-target'] || '';
const branchId = args['branch-id'] || '';

if (!performedBy || performedBy.length < 3) {
  console.error('Missing --performed-by <name or email> (min 3 chars).');
  exit(2);
}
if (!pitrTarget) {
  console.error('Missing --pitr-target <ISO timestamp the restore targeted>.');
  exit(2);
}

const targetUrl = clean(process.env.TARGET_SUPABASE_URL);
const targetKey = clean(process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY);
const prodUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const prodKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!targetUrl || !targetKey) {
  console.error('Need TARGET_SUPABASE_URL + TARGET_SUPABASE_SERVICE_ROLE_KEY for the restored branch.');
  exit(2);
}
if (!prodUrl || !prodKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (prod ledger).');
  exit(2);
}

const target = createClient(targetUrl, targetKey, { auth: { persistSession: false } });
const ledger = createClient(prodUrl, prodKey, { auth: { persistSession: false } });

const RPO_TARGET_MINUTES = 60;
const RTO_TARGET_MINUTES = 240;

// Invariants — each returns { name, passed, detail }. Tunable as the
// schema evolves. Keep small + cheap so the drill stays under 30
// minutes.
async function checkOrganizationsTableNonEmpty() {
  const { count, error } = await target
    .from('organizations')
    .select('id', { count: 'exact', head: true });
  return {
    name: 'organizations_non_empty',
    passed: !error && (count ?? 0) > 0,
    detail: error?.message ?? `count=${count}`,
  };
}

async function checkAuditLogChainIntact() {
  // Latest row has entry_hash + sequence_number; basic sanity.
  const { data, error } = await target
    .from('audit_log')
    .select('id, entry_hash, sequence_number')
    .not('entry_hash', 'is', null)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    return { name: 'audit_log_chain_present', passed: false, detail: error.message };
  }
  return {
    name: 'audit_log_chain_present',
    passed: !!data?.entry_hash,
    detail: data ? `top_seq=${data.sequence_number}` : 'no_chained_rows',
  };
}

async function checkOrgEvidenceHashNotNull() {
  // R9 NOT NULL invariant — should survive the restore.
  const { count, error } = await target
    .from('org_evidence')
    .select('id', { count: 'exact', head: true })
    .is('file_hash', null);
  if (error) return { name: 'evidence_file_hash_not_null', passed: false, detail: error.message };
  return {
    name: 'evidence_file_hash_not_null',
    passed: (count ?? 0) === 0,
    detail: `null_count=${count}`,
  };
}

async function checkAdminAuditLogPresent() {
  const { count, error } = await target
    .from('admin_audit_log')
    .select('id', { count: 'exact', head: true });
  if (error) return { name: 'admin_audit_log_present', passed: false, detail: error.message };
  return {
    name: 'admin_audit_log_present',
    passed: (count ?? 0) >= 0, // table exists + reachable
    detail: `count=${count}`,
  };
}

async function checkFrameworksIntegrity() {
  const { data, error } = await target
    .from('frameworks')
    .select('slug')
    .eq('is_active', true);
  if (error) return { name: 'frameworks_integrity', passed: false, detail: error.message };
  const slugs = (data ?? []).map((r) => r.slug);
  const expected = ['soc2', 'soc2-tsc', 'iso27001-2022', 'gdpr', 'hipaa', 'pci-dss', 'nist-csf', 'cis-controls', 'ndis'];
  const missing = expected.filter((s) => !slugs.includes(s));
  return {
    name: 'frameworks_integrity',
    passed: missing.length === 0,
    detail: missing.length ? `missing=${missing.join(',')}` : `present=${slugs.length}`,
  };
}

const start = Date.now();

const invariants = await Promise.all([
  checkOrganizationsTableNonEmpty(),
  checkAuditLogChainIntact(),
  checkOrgEvidenceHashNotNull(),
  checkAdminAuditLogPresent(),
  checkFrameworksIntegrity(),
]);

const durationMin = Math.max(1, Math.round((Date.now() - start) / 60_000));
const passed = invariants.filter((i) => i.passed).map((i) => i.name);
const failed = invariants.filter((i) => !i.passed).map((i) => `${i.name}: ${i.detail}`);

const outcome = failed.length === 0 ? 'passed' : failed.length === invariants.length ? 'failed' : 'partial';

console.log(`\nRestore test outcome: ${outcome}`);
console.log(`Duration: ${durationMin} min(s)`);
console.log(`Passed (${passed.length}):`);
for (const p of passed) console.log(`  ✓ ${p}`);
if (failed.length) {
  console.log(`Failed (${failed.length}):`);
  for (const f of failed) console.log(`  ✗ ${f}`);
}

const { data, error } = await ledger.rpc('record_restore_test_run', {
  p_performed_by: performedBy,
  p_outcome: outcome,
  p_rpo_target_minutes: RPO_TARGET_MINUTES,
  p_rto_target_minutes: RTO_TARGET_MINUTES,
  p_restored_pitr_target: pitrTarget,
  p_restored_branch_id: branchId || null,
  p_duration_minutes: durationMin,
  p_invariants_checked: invariants.map((i) => i.name),
  p_invariants_failed: invariants.filter((i) => !i.passed).map((i) => i.name),
  p_notes: null,
});

if (error) {
  console.error(`\nFailed to write restore_test_runs row: ${error.message}`);
  exit(1);
}

console.log(`\n✓ Recorded restore_test_runs row: ${data}`);
exit(outcome === 'failed' ? 1 : 0);
