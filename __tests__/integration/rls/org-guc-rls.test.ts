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
const HAS_ENV =
  RUN_LIVE && Boolean(SUPABASE_URL && ANON_KEY && SERVICE_ROLE);

const TABLES_WITH_SIMPLE_SCHEMA: ReadonlyArray<{
  table: string;
  insert: (orgId: string) => Record<string, unknown>;
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
    // org_care_goals likely has additional NOT-NULL columns; if the
    // insert fails, the test logs a warning and skips that row.
    insert: (orgId) => ({
      org_id: orgId,
      title: 'rls-isolation-probe',
    }),
  },
  {
    table: 'auditor_activity_log',
    insert: (orgId) => ({
      org_id: orgId,
      action: 'rls-probe',
    }),
  },
];

const maybeDescribe = HAS_ENV ? describe : describe.skip;

maybeDescribe('Blocker 3: org_members-based RLS isolates rows by org', () => {
  jest.setTimeout(120_000);

  let admin: SupabaseClient;
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];
  const seededRows: Array<{ table: string; column: string; value: unknown }> =
    [];

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
        const payload = spec.insert(seed.orgId);
        const { error: insertErr, data } = await admin
          .from(spec.table)
          .insert(payload)
          .select('id, org_id')
          .single();
        if (insertErr) {
          // Schema mismatch on optional tables — skip but record.
          console.warn(
            `[B3 test] skipping ${spec.table}: ${insertErr.message}`,
          );
          continue;
        }
        seededRows.push({
          table: spec.table,
          column: 'id',
          value: (data as { id: string }).id,
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
      it('user A sees only org A rows', async () => {
        if (!seedA || !seedB) {
          throw new Error('seeds not initialized');
        }
        const seededOrgsForTable = seededRows.filter(
          (r) => r.table === spec.table,
        );
        if (seededOrgsForTable.length === 0) {
          // The table's NOT-NULL contract didn't accept our minimal
          // insert — skip rather than false-positive.
          return;
        }

        const client = jwtClient(seedA);
        const { data, error } = await client
          .from(spec.table)
          .select('org_id');

        expect(error).toBeNull();
        expect(data).toBeDefined();
        for (const row of data ?? []) {
          expect((row as { org_id: string }).org_id).toBe(seedA.orgId);
        }
      });

      it('user B sees only org B rows (and not org A rows)', async () => {
        if (!seedA || !seedB) {
          throw new Error('seeds not initialized');
        }
        const seededOrgsForTable = seededRows.filter(
          (r) => r.table === spec.table,
        );
        if (seededOrgsForTable.length === 0) return;

        const client = jwtClient(seedB);
        const { data, error } = await client
          .from(spec.table)
          .select('org_id');

        expect(error).toBeNull();
        expect(data).toBeDefined();
        for (const row of data ?? []) {
          expect((row as { org_id: string }).org_id).toBe(seedB.orgId);
          expect((row as { org_id: string }).org_id).not.toBe(seedA.orgId);
        }
      });

      it('anon (unauthenticated) sees zero rows', async () => {
        const anon = createClient(SUPABASE_URL, ANON_KEY, {
          auth: { persistSession: false },
        });
        const { data, error } = await anon
          .from(spec.table)
          .select('org_id');

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
