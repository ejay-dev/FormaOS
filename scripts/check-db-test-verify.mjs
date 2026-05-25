#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

config({ path: '.env.local' });

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

const requiredTables = [
  'organizations',
  'org_members',
  'org_forms',
  'org_form_submissions',
  'org_form_templates',
  'org_evidence',
  'org_first_session_progress',
  'org_care_plans',
  'org_audit_logs',
  'security_audit_log',
  'organization_sso',
];

const requiredBuckets = ['evidence'];

// Audit 2026-05-23: filenames previously used a `YYYYMMDD_NNN_*.sql`
// underscore format; actual files on disk use `YYYYMMDDNNN_*.sql` (no
// underscore between date and sequence). The script silently fail'd for
// 5 of these every CI run. Renaming the migrations on disk would change
// the recorded names in supabase_migrations.schema_migrations and risk
// re-apply / hash mismatch on the next `db push`, so the safer fix is
// to patch the script.
const policyExpectations = [
  {
    table: 'org_forms',
    files: ['20260426001_ensure_forms_platform_schema.sql'],
    patterns: ['alter table public.org_forms enable row level security', 'org_forms_select'],
  },
  {
    table: 'org_form_submissions',
    files: ['20260426001_ensure_forms_platform_schema.sql'],
    patterns: [
      'alter table public.org_form_submissions enable row level security',
      'org_form_submissions_select',
    ],
  },
  {
    table: 'org_evidence',
    files: ['20260425003_fix_org_evidence_rls.sql'],
    patterns: ['CREATE POLICY "org_evidence_org_isolation"'],
  },
  {
    table: 'org_care_plans',
    files: ['20260617_fix_care_plans_rls_update.sql'],
    patterns: ['CREATE POLICY "care_plans_org_isolation"'],
  },
  {
    table: 'organization_sso',
    files: ['20260426002_ensure_organization_sso_schema.sql'],
    patterns: ['alter table public.organization_sso enable row level security'],
  },
];

const failures = [];
const cleanup = {
  userId: null,
  orgId: null,
  formId: null,
};

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function skip(message) {
  console.log(`SKIP ${message}`);
}

function assertConfigured() {
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length > 0) {
    // GitHub Actions does not (and shouldn't) carry production Supabase
    // secrets — the previous behavior failed every PR's Core Build Gate
    // because db:test:verify hard-failed when env was absent. Mirror the
    // Vercel-preview tolerance pattern: warn loudly, exit 0 in CI.
    // Setting CHECK_DB_TEST_VERIFY_STRICT=1 forces the original hard
    // fail (use this in workflows that genuinely have the env).
    const inCi = process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true';
    const forceStrict = process.env.CHECK_DB_TEST_VERIFY_STRICT === '1';
    if (inCi && !forceStrict) {
      console.warn(
        `\n⚠️  db:test:verify skipped — missing env: ${missing.join(', ')}`,
      );
      console.warn(
        '  This check requires a real Supabase project. To enforce in CI, set ' +
          'CHECK_DB_TEST_VERIFY_STRICT=1 and provide secrets in repository settings.',
      );
      process.exit(0);
    }
    fail(`Missing Supabase env: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

function createSupabaseClients() {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { admin, anon };
}

async function verifyTable(admin, table) {
  const { error } = await admin.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    fail(`Table ${table} is not queryable: ${error.message}`);
    if (error.code === 'PGRST205') {
      fail(
        `PostgREST schema cache does not expose ${table}. Confirm migrations are applied to ${new URL(supabaseUrl).hostname} and reload schema cache.`,
      );
    }
    return;
  }
  pass(`Table ${table} is queryable`);
}

async function verifyBucket(admin, bucket) {
  const { error } = await admin.storage.getBucket(bucket);
  if (error) {
    fail(`Storage bucket ${bucket} is not available: ${error.message}`);
    return;
  }
  pass(`Storage bucket ${bucket} exists`);
}

function verifyMigrationPolicyText() {
  const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');

  for (const expectation of policyExpectations) {
    const text = expectation.files
      .map((file) => {
        const fullPath = path.join(migrationDir, file);
        return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
      })
      .join('\n');

    // Audit 2026-05-23 (Sprint 5b): previously pass() was logged
    // unconditionally after the for-pattern loop, even when one or
    // more patterns failed. CI log lines showed "PASS Migration policy
    // text covers X" right alongside the FAIL lines for the same X.
    // Track expectationOk so the pass log only fires when every pattern
    // for this expectation actually matched.
    let expectationOk = true;
    for (const pattern of expectation.patterns) {
      if (!text.includes(pattern)) {
        expectationOk = false;
        fail(`Migration policy check missing "${pattern}" for ${expectation.table}`);
      }
    }
    if (expectationOk) {
      pass(`Migration policy text covers ${expectation.table}`);
    }
  }
}

async function verifyAuthenticatedFormsRoundTrip(admin, anon) {
  const email = `db-verify-${Date.now()}@test.formaos.local`;
  const password = `FormaOS-test-${Date.now()}!`;

  const { data: userResult, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError || !userResult.user) {
    fail(`Could not create authenticated schema probe user: ${userError?.message || 'no user returned'}`);
    return;
  }

  cleanup.userId = userResult.user.id;

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: `FormaOS DB Verify ${Date.now()}`,
      created_by: cleanup.userId,
      industry: 'saas',
      frameworks: ['soc2'],
      onboarding_completed: true,
    })
    .select('id')
    .single();

  if (orgError || !org?.id) {
    fail(`Could not create test organization: ${orgError?.message || 'no org returned'}`);
    return;
  }

  cleanup.orgId = org.id;

  // Mirror to legacy `orgs` table (v4-001). Without this the probe org
  // leaves a reverse-direction orphan that trips the qa:deep regression
  // gate on the next run.
  const { error: legacyOrgsError } = await admin.from('orgs').upsert(
    {
      id: cleanup.orgId,
      name: `FormaOS DB Verify ${Date.now()}`,
      created_by: cleanup.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (legacyOrgsError) {
    fail(`Could not mirror probe org to legacy orgs: ${legacyOrgsError.message}`);
    return;
  }

  const { error: memberError } = await admin.from('org_members').insert({
    organization_id: cleanup.orgId,
    user_id: cleanup.userId,
    role: 'owner',
  });
  if (memberError) {
    fail(`Could not create test org membership: ${memberError.message}`);
    return;
  }

  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signIn.session) {
    fail(`Could not sign in schema probe user: ${signInError?.message || 'no session returned'}`);
    return;
  }

  const authed = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${signIn.session.access_token}`,
      },
    },
  });

  const slug = `db-verify-${Date.now()}`;
  const { data: form, error: formError } = await authed
    .from('org_forms')
    .insert({
      org_id: cleanup.orgId,
      title: 'DB verification form',
      slug,
      status: 'published',
      fields: [{ id: 'name', label: 'Name', type: 'text' }],
      settings: {},
      created_by: cleanup.userId,
    })
    .select('id, title, slug')
    .single();

  if (formError || !form?.id) {
    fail(`Authenticated org_forms insert failed: ${formError?.message || 'no form returned'}`);
    return;
  }

  cleanup.formId = form.id;
  pass('Authenticated org_forms insert/read works');

  const { data: submission, error: submissionError } = await authed
    .from('org_form_submissions')
    .insert({
      form_id: cleanup.formId,
      org_id: cleanup.orgId,
      submitted_by: cleanup.userId,
      respondent_email: email,
      respondent_name: 'DB Verify',
      data: { name: 'DB Verify' },
      metadata: { source: 'db:test:verify' },
      status: 'submitted',
    })
    .select('id, data')
    .single();

  if (submissionError || !submission?.id) {
    fail(
      `Authenticated org_form_submissions insert/read failed: ${submissionError?.message || 'no submission returned'}`,
    );
    return;
  }

  pass('Authenticated org_form_submissions insert/read works');

  for (const table of ['org_evidence', 'org_first_session_progress', 'org_care_plans', 'org_audit_logs']) {
    const { error } = await authed.from(table).select('*', { head: true, count: 'exact' });
    if (error) {
      fail(`Authenticated select for ${table} failed: ${error.message}`);
    } else {
      pass(`Authenticated select for ${table} works`);
    }
  }
}

async function deleteAndLog(admin, table, query) {
  const { error } = await query;
  if (error) {
    // Audit Sprint 7a (2026-05-24): previously cleanup errors were
    // ignored. Live DB had 95 leftover "FormaOS DB Verify" orgs
    // because a failing delete left rows behind silently. Log so the
    // operator can investigate without grepping prod for orphans.
    console.warn(`[cleanupProbe] ${table} delete failed: ${error.message}`);
  }
}

async function cleanupProbe(admin) {
  if (cleanup.formId) {
    await deleteAndLog(
      admin,
      'org_form_submissions',
      admin.from('org_form_submissions').delete().eq('form_id', cleanup.formId),
    );
    await deleteAndLog(
      admin,
      'org_forms',
      admin.from('org_forms').delete().eq('id', cleanup.formId),
    );
  }
  if (cleanup.orgId) {
    await deleteAndLog(
      admin,
      'org_members',
      admin.from('org_members').delete().eq('organization_id', cleanup.orgId),
    );
    await deleteAndLog(
      admin,
      'organizations',
      admin.from('organizations').delete().eq('id', cleanup.orgId),
    );
    // Audit 2026-05-25: the AFTER DELETE trigger
    // `trg_mirror_organizations_delete_to_orgs` (migration 20260624029)
    // removes the matching `orgs` row automatically. Calling
    // `from('orgs').delete()` explicitly after `from('organizations')`
    // raced and left `organizations` stranded when the parent delete
    // failed silently (Supabase returns {error} rather than throwing).
  }
  if (cleanup.userId) {
    const { error } = await admin.auth.admin.deleteUser(cleanup.userId);
    if (error) {
      console.warn(`[cleanupProbe] auth user delete failed: ${error.message}`);
    }
  }
}

/**
 * Audit Sprint 7a (2026-05-24): sweep any "FormaOS DB Verify <ts>"
 * orgs older than 1 hour. The script has been accumulating probe
 * orgs whenever cleanupProbe silently failed (no error logging
 * pre-this-fix). Run at the START of each invocation so a healthy
 * env doesn't accumulate orphans even if the new error logging
 * surfaces a future bug after-the-fact.
 *
 * Scoped narrowly:
 *   - name LIKE 'FormaOS DB Verify%' so we don't touch real orgs
 *   - created_at < now() - 1 hour so we never delete a probe that's
 *     currently running in a parallel invocation
 */
async function sweepOldProbes(admin) {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: orphans, error: listError } = await admin
    .from('organizations')
    .select('id, name, created_at')
    .like('name', 'FormaOS DB Verify%')
    .lt('created_at', cutoff)
    .limit(500);

  if (listError) {
    console.warn(`[sweepOldProbes] list failed: ${listError.message}`);
    return;
  }

  const rows = orphans ?? [];
  if (rows.length === 0) return;

  console.log(`[sweepOldProbes] removing ${rows.length} stale probe org(s)`);
  const ids = rows.map((r) => r.id);

  // Order matters — FK-respecting teardown.
  await deleteAndLog(
    admin,
    'org_form_submissions',
    admin.from('org_form_submissions').delete().in('org_id', ids),
  );
  await deleteAndLog(
    admin,
    'org_forms',
    admin.from('org_forms').delete().in('org_id', ids),
  );
  await deleteAndLog(
    admin,
    'org_members',
    admin.from('org_members').delete().in('organization_id', ids),
  );
  await deleteAndLog(
    admin,
    'organizations',
    admin.from('organizations').delete().in('id', ids),
  );
  // Audit 2026-05-25: orgs mirror is cleared by the DELETE trigger
  // (migration 20260624029) — explicit cleanup would race.
}

async function main() {
  console.log('FormaOS DB test verification');
  console.log(`Target Supabase host: ${supabaseUrl ? new URL(supabaseUrl).hostname : 'not configured'}`);

  if (!assertConfigured()) {
    process.exitCode = 1;
    return;
  }

  const { admin, anon } = createSupabaseClients();

  // Audit Sprint 7a: clean up any stale probe orgs from prior runs
  // before doing the current check. Bounded to "FormaOS DB Verify%"
  // older than 1h so a parallel invocation isn't disturbed.
  await sweepOldProbes(admin);

  try {
    for (const table of requiredTables) {
      await verifyTable(admin, table);
    }
    for (const bucket of requiredBuckets) {
      await verifyBucket(admin, bucket);
    }
    verifyMigrationPolicyText();
    await verifyAuthenticatedFormsRoundTrip(admin, anon);
  } finally {
    await cleanupProbe(admin);
  }

  if (failures.length > 0) {
    console.error(`\nDB test verification failed (${failures.length} issue(s)).`);
    process.exitCode = 1;
    return;
  }

  console.log('\nDB test verification passed.');
}

main().catch((error) => {
  console.error('Fatal DB verification error:', error);
  process.exitCode = 1;
});
