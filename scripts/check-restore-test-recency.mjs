#!/usr/bin/env node

// Audit 2026-05-27 — CI gate: fail the build if no successful restore
// test in the last 35 days. Threshold a few days past the documented
// monthly cadence so a one-week slip is allowed.

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

function clean(v) { return (v || '').trim().replace(/^['"]|['"]$/g, ''); }

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);

if (!supabaseUrl || !serviceRoleKey) {
  console.log('ℹ️  Skipping restore-test recency check — no Supabase service credentials.');
  process.exit(0);
}

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const MAX_AGE_DAYS = 35;

const { data, error } = await admin.rpc('latest_restore_test_run');
if (error) {
  console.error(`latest_restore_test_run RPC failed: ${error.message}`);
  process.exit(1);
}

const latest = Array.isArray(data) && data.length > 0 ? data[0] : null;
if (!latest) {
  // First-run state: ledger empty. Warn but don't fail — gives the
  // operator a window to record the first drill without blocking
  // deploys. After the first row lands, the 35-day gap rule kicks in.
  //
  // OPERATOR HEADS-UP: the moment the FIRST restore_test_runs row
  // lands, this check stops being warn-only — it starts blocking after
  // (first row's performed_at + 35 days). Calendar a follow-up drill
  // within that window or this gate will go red on the next main push
  // past day 35.
  console.warn(
    `⚠️  No restore_test_runs row recorded yet. Run the first DR drill — ` +
    `see docs/operations/pitr-restore-runbook.md. ` +
    `This check WILL fail once an initial row exists and >35 days pass.`,
  );
  process.exit(0);
}

// After-first-row state: emit the time-bomb date in the success path
// so operators see "next drill due by YYYY-MM-DD" in their CI summary
// without having to do the arithmetic. Quiet on warn-only path (above)
// since there's no row to anchor the math.

const days = latest.days_since;
if (days > MAX_AGE_DAYS) {
  console.error(
    `❌ Latest successful restore test is ${days} days old (max ${MAX_AGE_DAYS}).\n` +
    `   Run the monthly DR drill — see docs/operations/pitr-restore-runbook.md.\n` +
    `   Last outcome: ${latest.outcome} at ${latest.performed_at}.`,
  );
  process.exit(1);
}

const nextDueIso = new Date(
  new Date(latest.performed_at).getTime() + MAX_AGE_DAYS * 86_400_000,
).toISOString().slice(0, 10);
console.log(
  `✓ Latest restore test: ${latest.outcome} (${days} days ago, within ${MAX_AGE_DAYS}-day window). ` +
  `Next drill due by ${nextDueIso} or this gate goes red.`,
);
process.exit(0);
