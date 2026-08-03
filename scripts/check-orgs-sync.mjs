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

    // Sentinel: prove the org-id foreign keys on a representative
    // dependent still resolve to organizations(id) — and that they are
    // still ENFORCED.
    //
    // The probe row must be complete apart from the org id. org_subscriptions
    // has NOT NULL org_id / plan_code / plan_key plus an FK on plan_code →
    // billing_plans(code); a partial row fails on one of those long before
    // Postgres evaluates the organization FK. The previous version inserted
    // only { organization_id, plan_key } and treated ANY error as proof of
    // enforcement, so a dropped organization FK still reported PASS.
    //
    // The insert is expected to abort, so nothing is written to the target
    // database. If it ever succeeds we delete the row and fail loudly.
    const fakeOrgId = '00000000-0000-4000-8000-000000000000';
    const probe = await admin
      .from('org_subscriptions')
      .insert({
        org_id: fakeOrgId,
        organization_id: fakeOrgId,
        plan_code: 'starter',
        plan_key: 'basic',
        status: 'trialing',
      })
      .select('org_id')
      .single();

    if (probe.error) {
      const detail = `${probe.error.message ?? ''} ${probe.error.details ?? ''}`;
      const isForeignKeyViolation = probe.error.code === '23503';
      const namesOrgs = /\borgs\b/.test(detail) && !/organizations/.test(detail);
      const namesOrganizations =
        /is not present in table "organizations"/i.test(detail) ||
        /org_subscriptions_(org_id|organization_id)_fkey/i.test(detail);

      if (namesOrgs) {
        fail(
          `org_subscriptions FK still references orgs — got: ${probe.error.message}`,
        );
      } else if (isForeignKeyViolation && namesOrganizations) {
        pass(
          'org_subscriptions.org_id is still an enforced FK onto organizations(id).',
        );
      } else if (isForeignKeyViolation) {
        fail(
          `org_subscriptions probe tripped a different foreign key before reaching the organization FK — the sentinel row is stale. code=${probe.error.code} detail=${detail.trim()}`,
        );
      } else {
        fail(
          `org_subscriptions probe failed before the organization FK could be evaluated (expected SQLSTATE 23503). code=${probe.error.code} detail=${detail.trim()}`,
        );
      }
    } else {
      // Insert succeeded with a non-existent organization. Clean up and
      // flag — the FK is no longer enforcing.
      await admin.from('org_subscriptions').delete().eq('org_id', fakeOrgId);
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
