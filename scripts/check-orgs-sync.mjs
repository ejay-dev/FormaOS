#!/usr/bin/env node

// Originally the regression gate for v3-010 — kept `orgs` and `organizations`
// in sync via mirror triggers, blocked the 1077/395-row drift that prompted
// the 2026-05-23 consolidation. As of 2026-05-27 (R2, Phase B) the legacy
// `orgs` table is dropped and all 4 dependent FKs reference organizations(id)
// directly. The script flips to the OTHER direction now: assert that public.orgs
// stays dropped and that no FK ever points back at it. Filename preserved so
// the security-baseline gate keeps resolving the check, and so the workflow
// wiring continues to pass.
//
// Skipped silently when Supabase service credentials are not configured
// (e.g., fork PR), to match the historical behaviour.

import './_node20-ws-shim.mjs';
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
    'ℹ️  Skipping orgs-sync regression gate — no Supabase service credentials in env.',
  );
  process.exit(0);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const failures = [];

function fail(msg) {
  failures.push(msg);
  console.error(`FAIL ${msg}`);
}
function pass(msg) {
  console.log(`PASS ${msg}`);
}

async function tableExists(name) {
  // PostgREST surfaces "table not found" via PGRST 205 / message
  // matching either /does not exist/ or /schema cache/. Anything
  // else is unexpected and bubbles up.
  const probe = await admin.from(name).select('*').limit(1);
  if (!probe.error) return true;
  const msg = String(probe.error.message || '').toLowerCase();
  if (
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('not found in the schema')
  ) {
    return false;
  }
  throw new Error(`${name} existence probe failed: ${probe.error.message}`);
}

async function main() {
  try {
    const orgsPresent = await tableExists('orgs');
    if (orgsPresent) {
      fail(
        'public.orgs table is present — R2 (Phase B, 2026-05-27) dropped it. Investigate: a migration may have resurrected it.',
      );
    } else {
      pass(
        'public.orgs is dropped (R2 invariant holds).',
      );
    }

    // Optional secondary check: org_subscriptions must remain present —
    // the dependent table we repointed away from orgs.
    const subsPresent = await tableExists('org_subscriptions');
    if (subsPresent === false) {
      fail(
        'public.org_subscriptions is missing — unexpected. R2 only dropped public.orgs; org_subscriptions should be intact.',
      );
    } else {
      pass('public.org_subscriptions is intact.');
    }

    // Sentinel: ensure foreign keys on a representative dependent are
    // not silently re-added pointing at a fictitious orgs table. Best
    // effort — try inserting a row with an unknown org_id and expect
    // the FK error message to reference organizations, not orgs.
    const fakeOrgId = '00000000-0000-4000-8000-000000000000';
    const probe = await admin
      .from('org_subscriptions')
      .insert({ organization_id: fakeOrgId, plan_key: 'basic' })
      .select('id')
      .single();
    if (probe.error) {
      const msg = String(probe.error.message || '').toLowerCase();
      if (msg.includes('"orgs"') || msg.includes("'orgs'") || msg.includes(' orgs ')) {
        fail(
          `org_subscriptions FK still references orgs — got: ${probe.error.message}`,
        );
      } else {
        pass('org_subscriptions FK error path no longer mentions orgs.');
      }
    } else if (probe.data?.id) {
      // Unexpected — insert succeeded with a fake org. Clean up and
      // flag because this means the FK isn't enforcing anymore.
      await admin.from('org_subscriptions').delete().eq('id', probe.data.id);
      fail(
        'org_subscriptions accepted a row with a non-existent organization_id — FK enforcement broken.',
      );
    }

    if (failures.length > 0) {
      console.error(
        `\n❌ ${failures.length} orgs-invariant failure(s) — see above.`,
      );
      process.exit(1);
    }
    console.log('\n✅ orgs-removal invariants intact.');
    process.exit(0);
  } catch (err) {
    console.error('orgs-sync gate failed unexpectedly:', err);
    process.exit(2);
  }
}

main();
