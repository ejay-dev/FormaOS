/** @jest-environment node */

/**
 * Integration test for Blocker 3 — org_members-based RLS isolation.
 *
 * Pre-fix: 14 policies depended on the unset
 *   current_setting('app.current_org_id', true)::uuid
 * GUC. Authenticated reads returned zero rows in *every* org because
 * NULL = NULL is NULL under RLS, which denies. Service-role bypassed
 * RLS so admin paths were silently fine — masking the bug.
 *
 * Post-fix: every authenticated user sees only rows where they
 * have an `org_members` row matching `org_id`.
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE)
 *   - Migration 20260623_002_fix_org_guc_rls.sql applied
 *
 * Without those, the suite skips with an informative message.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
const SERVICE_ROLE = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  ''
).trim();

// This is a live-database integration test. Opt-in only — `npm test`
// in CI/dev should not pay the cost of round-tripping to Supabase
// admin APIs unless the runner has set RUN_INTEGRATION_TESTS=1.
const RUN_LIVE = process.env.RUN_INTEGRATION_TESTS === '1';
const HAS_ENV = RUN_LIVE && Boolean(SUPABASE_URL && ANON_KEY && SERVICE_ROLE);

type SeedContext = {
  admin: SupabaseClient;
  orgId: string;
  userId: string;
  /** Registers a prerequisite row for teardown (deleted in reverse order). */
  track: (table: string, id: string) => void;
};

const TABLES_WITH_SIMPLE_SCHEMA: ReadonlyArray<{
  table: string;
  insert: (orgId: string) => Record<string, unknown>;
  /**
   * Creates FK parents this table requires and returns the extra columns
   * to merge into the insert. Verified against the production schema —
   * org_care_goals needs a care plan (which needs a patient) and
   * auditor_activity_log needs an auditor token.
   */
  dependencies?: (ctx: SeedContext) => Promise<Record<string, unknown>>;
}> = [
  // The 14 affected tables have varying schemas; we cover one
  // representative per source migration. Each shape uses minimum
  // NOT-NULL columns required to insert a row.
  {
    table: 'org_analytics_snapshots',
    insert: (orgId) => ({
      org_id: orgId,
      snapshot_date: '2026-05-09',
      metrics: { ok: true },
    }),
  },
  {
    table: 'search_index',
    insert: (orgId) => ({
      org_id: orgId,
      entity_type: 'task',
      entity_id: '00000000-0000-0000-0000-000000000001',
      title: 'rls-isolation-probe',
      body: '',
    }),
  },
  {
    table: 'org_care_goals',
    // Was {org_id, title}: org_care_goals has no `title` column and
    // requires care_plan_id + goal_text, so the insert always failed and
    // this table's isolation checks silently never ran.
    insert: (orgId) => ({
      org_id: orgId,
      goal_text: 'rls-isolation-probe',
    }),
    dependencies: async ({ admin, orgId, track }) => {
      const { data: patient, error: patientErr } = await admin
        .from('org_patients')
        .insert({ organization_id: orgId, full_name: 'RLS Probe Patient' })
        .select('id')
        .single();
      if (patientErr || !patient?.id) {
        throw new Error(`org_patients seed failed: ${patientErr?.message}`);
      }
      track('org_patients', patient.id as string);

      const { data: plan, error: planErr } = await admin
        .from('org_care_plans')
        .insert({
          organization_id: orgId,
          client_id: patient.id,
          title: 'RLS Probe Plan',
          start_date: '2026-05-09',
        })
        .select('id')
        .single();
      if (planErr || !plan?.id) {
        throw new Error(`org_care_plans seed failed: ${planErr?.message}`);
      }
      track('org_care_plans', plan.id as string);

      return { care_plan_id: plan.id, participant_id: patient.id };
    },
  },
  {
    table: 'auditor_activity_log',
    insert: (orgId) => ({
      org_id: orgId,
      action: 'rls-probe',
    }),
    dependencies: async ({ admin, orgId, userId, track }) => {
      // token_id is NOT NULL and references auditor_access_tokens.
      const { data: token, error: tokenErr } = await admin
        .from('auditor_access_tokens')
        .insert({
          org_id: orgId,
          auditor_name: 'RLS Probe Auditor',
          auditor_email: `rls-probe-${orgId}@test.formaos.local`,
          token_hash: `rls-probe-${orgId}-${Date.now()}`,
          expires_at: new Date(Date.now() + 86_400_000).toISOString(),
          created_by: userId,
        })
        .select('id')
        .single();
      if (tokenErr || !token?.id) {
        throw new Error(
          `auditor_access_tokens seed failed: ${tokenErr?.message}`,
        );
      }
      track('auditor_access_tokens', token.id as string);

      return { token_id: token.id };
    },
  },
];

const maybeDescribe = HAS_ENV ? describe : describe.skip;

maybeDescribe('Blocker 3: org_members-based RLS isolates rows by org', () => {
  jest.setTimeout(120_000);

  let admin: SupabaseClient;
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];
  const seededRows: Array<{
    table: string;
    column: string;
    value: string;
    orgId: string;
  }> = [];
  // FK parents created for the tables that need them, deleted in reverse.
  const dependencyRows: Array<{ table: string; id: string }> = [];

  const PASSWORD = 'RlsTest!Secure-2026';

  type Seed = {
    userId: string;
    orgId: string;
    email: string;
    accessToken: string;
  };
  let seedA: Seed | null = null;
  let seedB: Seed | null = null;

  async function provisionOrgWithUser(label: string): Promise<Seed> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const email = `rls-${label}-${id}@test.formaos.local`;

    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { is_e2e_test: true, rls_test: true },
      });
    if (createErr || !created?.user) {
      throw new Error(`createUser failed: ${createErr?.message}`);
    }
    createdUserIds.push(created.user.id);

    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({ name: `RLS Org ${label} ${id}`, plan_key: 'pro' })
      .select('id')
      .single();
    if (orgErr || !org?.id) {
      throw new Error(`organizations insert failed: ${orgErr?.message}`);
    }
    createdOrgIds.push(org.id);

    await admin.from('org_members').insert({
      user_id: created.user.id,
      organization_id: org.id,
      role: 'owner',
    });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: signed, error: signInErr } =
      await userClient.auth.signInWithPassword({ email, password: PASSWORD });
    if (signInErr || !signed?.session?.access_token) {
      throw new Error(`signIn failed: ${signInErr?.message}`);
    }

    return {
      userId: created.user.id,
      orgId: org.id,
      email,
      accessToken: signed.session.access_token,
    };
  }

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });
    seedA = await provisionOrgWithUser('a');
    seedB = await provisionOrgWithUser('b');

    // Seed one row per table per org with service-role.
    for (const spec of TABLES_WITH_SIMPLE_SCHEMA) {
      for (const seed of [seedA, seedB]) {
        const extraColumns = spec.dependencies
          ? await spec.dependencies({
              admin,
              orgId: seed.orgId,
              userId: seed.userId,
              track: (table, id) => dependencyRows.push({ table, id }),
            })
          : {};
        const payload = { ...spec.insert(seed.orgId), ...extraColumns };
        const { error: insertErr, data } = await admin
          .from(spec.table)
          .insert(payload)
          .select('id, org_id')
          .single();
        if (insertErr) {
          // Fail the suite instead of warning. A skipped seed used to mean
          // the per-table isolation checks below ran zero assertions while
          // CI stayed green — the failure mode this gate exists to prevent.
          throw new Error(
            `[B3 test] seed insert failed for ${spec.table}: ${insertErr.message}`,
          );
        }
        seededRows.push({
          table: spec.table,
          column: 'id',
          value: (data as { id: string }).id,
          orgId: seed.orgId,
        });
      }
    }
  });

  afterAll(async () => {
    for (const row of seededRows) {
      await admin
        .from(row.table)
        .delete()
        .eq(row.column as string, row.value);
    }
    for (const dep of [...dependencyRows].reverse()) {
      await admin.from(dep.table).delete().eq('id', dep.id);
    }
    for (const orgId of createdOrgIds) {
      await admin.from('org_members').delete().eq('organization_id', orgId);
      await admin.from('organizations').delete().eq('id', orgId);
    }
    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  function jwtClient(seed: Seed): SupabaseClient {
    return createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${seed.accessToken}` },
      },
    });
  }

  for (const spec of TABLES_WITH_SIMPLE_SCHEMA) {
    describe(`${spec.table}`, () => {
      // Both directions assert the positive case (the caller's own row is
      // visible) as well as the negative one. Without the positive half a
      // policy that returns nothing to anybody — the pre-fix GUC bug —
      // would still pass.
      function rowIdFor(orgId: string): string {
        const row = seededRows.find(
          (r) => r.table === spec.table && r.orgId === orgId,
        );
        expect(row).toBeTruthy();
        return (row as { value: string }).value;
      }

      it('user A sees only org A rows', async () => {
        if (!seedA || !seedB) {
          throw new Error('seeds not initialized');
        }
        const orgARowId = rowIdFor(seedA.orgId);
        const orgBRowId = rowIdFor(seedB.orgId);

        const client = jwtClient(seedA);
        const { data, error } = await client
          .from(spec.table)
          .select('id, org_id');

        expect(error).toBeNull();
        const ids = (data ?? []).map(
          (row: Record<string, unknown>) => row.id as string,
        );
        expect(ids).toContain(orgARowId);
        expect(ids).not.toContain(orgBRowId);
        for (const row of data ?? []) {
          expect((row as { org_id: string }).org_id).toBe(seedA.orgId);
        }
      });

      it('user B sees only org B rows (and not org A rows)', async () => {
        if (!seedA || !seedB) {
          throw new Error('seeds not initialized');
        }
        const orgARowId = rowIdFor(seedA.orgId);
        const orgBRowId = rowIdFor(seedB.orgId);

        const client = jwtClient(seedB);
        const { data, error } = await client
          .from(spec.table)
          .select('id, org_id');

        expect(error).toBeNull();
        const ids = (data ?? []).map(
          (row: Record<string, unknown>) => row.id as string,
        );
        expect(ids).toContain(orgBRowId);
        expect(ids).not.toContain(orgARowId);
        for (const row of data ?? []) {
          expect((row as { org_id: string }).org_id).toBe(seedB.orgId);
        }
      });

      it('anon (unauthenticated) sees zero rows', async () => {
        const anon = createClient(SUPABASE_URL, ANON_KEY, {
          auth: { persistSession: false },
        });
        const { data, error } = await anon.from(spec.table).select('org_id');

        // RLS for an unauthenticated request returns zero rows;
        // we accept either a clean empty array or a permission-denied
        // error — both prove the row is not visible.
        if (error) {
          expect(error.message.toLowerCase()).toMatch(
            /permission|denied|policy|row-level/,
          );
        } else {
          expect(data ?? []).toHaveLength(0);
        }
      });
    });
  }
});

// When the env is missing, surface a single skip describe so the
// reason is visible in CI output.
if (!HAS_ENV) {
  describe('Blocker 3: org_members-based RLS isolation [skipped]', () => {
    it.skip('requires SUPABASE env vars to run live', () => {
      // intentionally empty
    });
  });
}
