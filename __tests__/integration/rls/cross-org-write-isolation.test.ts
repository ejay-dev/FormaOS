/** @jest-environment node */

/**
 * Audit 2026-05-26 — adversarial RLS test for cross-org WRITE isolation.
 *
 * Companion to org-guc-rls.test.ts (which only covered read isolation).
 * Migration 20260624034 restored implicit WITH CHECK clauses that had
 * been dropped from ~30 FOR ALL policies during a refactor — meaning
 * UPDATEs could have written rows that violated tenant isolation between
 * the regression and the fix, with no automated test catching it.
 *
 * This harness picks one representative table per org-scoped surface and
 * verifies that:
 *   1. A JWT'd user from org A cannot UPDATE a row owned by org B
 *      (WITH CHECK denial).
 *   2. A JWT'd user from org A cannot INSERT a row with org_id = orgB
 *      (WITH CHECK denial on INSERT).
 *   3. A JWT'd user from org A cannot DELETE a row owned by org B
 *      (USING denial on DELETE).
 *
 * If any of these succeed silently the test fails — exactly the class of
 * regression that previously went undetected for months.
 *
 * Requires (same env contract as org-guc-rls.test.ts):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE)
 *   - RUN_INTEGRATION_TESTS=1
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

const RUN_LIVE = process.env.RUN_INTEGRATION_TESTS === '1';
const HAS_ENV = RUN_LIVE && Boolean(SUPABASE_URL && ANON_KEY && SERVICE_ROLE);

// Representative tables. Each must:
//   - have an org_id (or organization_id) column
//   - accept a minimal NOT-NULL insert under service-role
//   - have RLS policies that authenticate by org_members
//
// `idColumn` is the primary key used to address rows after seeding.
// `orgColumn` is whichever column the RLS policy joins through.
// `minimalInsert` returns the smallest row that passes table NOT-NULL.
const TARGET_TABLES: ReadonlyArray<{
  table: string;
  idColumn: string;
  orgColumn: 'org_id' | 'organization_id';
  minimalInsert: (orgId: string) => Record<string, unknown>;
  benignUpdate: Record<string, unknown>;
}> = [
  {
    table: 'org_tasks',
    idColumn: 'id',
    orgColumn: 'organization_id',
    minimalInsert: (orgId) => ({
      organization_id: orgId,
      title: 'rls-adversarial-probe',
      status: 'pending',
    }),
    benignUpdate: { title: 'attacker-edit' },
  },
  {
    table: 'org_policies',
    idColumn: 'id',
    orgColumn: 'organization_id',
    minimalInsert: (orgId) => ({
      organization_id: orgId,
      title: 'rls-adversarial-probe',
      status: 'draft',
    }),
    benignUpdate: { title: 'attacker-edit' },
  },
  {
    table: 'org_assets',
    idColumn: 'id',
    orgColumn: 'organization_id',
    minimalInsert: (orgId) => ({
      organization_id: orgId,
      name: 'rls-adversarial-probe',
      type: 'data',
    }),
    benignUpdate: { name: 'attacker-edit' },
  },
];

const maybeDescribe = HAS_ENV ? describe : describe.skip;

maybeDescribe('Audit 2026-05-26: cross-org WRITE isolation under RLS', () => {
  jest.setTimeout(120_000);

  let admin: SupabaseClient;
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];
  const seededRows: Array<{ table: string; idColumn: string; value: unknown }> =
    [];

  const PASSWORD = 'RlsAdvers!Secure-2026';

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
    const email = `rls-adv-${label}-${id}@test.formaos.local`;

    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { is_e2e_test: true, rls_adversarial_test: true },
      });
    if (createErr || !created?.user) {
      throw new Error(`createUser failed: ${createErr?.message}`);
    }
    createdUserIds.push(created.user.id);

    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({ name: `RLS Adv ${label} ${id}`, plan_key: 'pro' })
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

    // Seed one row per table per org with service-role. The attacker
    // (user A) will then attempt to mutate the org-B rows below.
    for (const spec of TARGET_TABLES) {
      for (const seed of [seedA, seedB]) {
        const payload = spec.minimalInsert(seed.orgId);
        const { error: insertErr, data } = await admin
          .from(spec.table)
          .insert(payload)
          .select(`${spec.idColumn}`)
          .single();
        if (insertErr) {
          // Fail loudly. A skipped seed means the WITH CHECK probes below
          // execute zero assertions while the suite reports green — the
          // exact silence this file exists to break. Schema drift (a new
          // NOT NULL column) must be fixed in the spec, not tolerated.
          throw new Error(
            `[adversarial RLS] seed insert failed for ${spec.table}: ${insertErr.message}`,
          );
        }
        seededRows.push({
          table: spec.table,
          idColumn: spec.idColumn,
          value: (data as Record<string, unknown>)[spec.idColumn],
        });
      }
    }
  });

  afterAll(async () => {
    for (const row of seededRows) {
      await admin
        .from(row.table)
        .delete()
        .eq(row.idColumn, row.value as string);
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

  for (const spec of TARGET_TABLES) {
    describe(`${spec.table}`, () => {
      it('user A cannot UPDATE a row owned by org B (WITH CHECK)', async () => {
        if (!seedA || !seedB) throw new Error('seeds not initialized');
        // Pick the seeded row that belongs to org B.
        const orgBRow = await admin
          .from(spec.table)
          .select(spec.idColumn)
          .eq(spec.orgColumn, seedB.orgId)
          .single();
        // Fail loudly if the org-B row is missing — returning here would
        // pass this WITH CHECK regression gate without probing anything.
        expect(orgBRow.error).toBeNull();
        expect(orgBRow.data).toBeTruthy();
        if (!orgBRow.data) return; // satisfies TS narrowing; unreachable

        const attackerClient = jwtClient(seedA);
        const { data: updated, error } = await attackerClient
          .from(spec.table)
          .update(spec.benignUpdate)
          .eq(
            spec.idColumn,
            (orgBRow.data as Record<string, unknown>)[spec.idColumn] as string,
          )
          .select(spec.idColumn);

        // Successful RLS denial: either an error code, or zero rows
        // returned (PostgREST quietly drops the row when the WHERE
        // matches no permitted rows). Both prove the attacker couldn't
        // touch the cross-org row. The failure case is `updated`
        // containing the row id — that would mean the WITH CHECK
        // regression is back.
        if (error) {
          // OK — explicit denial.
          expect(error.message.toLowerCase()).toMatch(
            /permission|denied|policy|row-level/,
          );
        } else {
          expect(updated ?? []).toHaveLength(0);
        }

        // Belt-and-braces: re-read the row as admin and confirm the
        // attacker's payload did NOT land.
        const after = await admin
          .from(spec.table)
          .select('*')
          .eq(
            spec.idColumn,
            (orgBRow.data as Record<string, unknown>)[spec.idColumn] as string,
          )
          .single();
        const benignKey = Object.keys(spec.benignUpdate)[0];
        expect((after.data as Record<string, unknown>)[benignKey]).not.toBe(
          (spec.benignUpdate as Record<string, unknown>)[benignKey],
        );
      });

      it('user A cannot INSERT a row with cross-org org_id (WITH CHECK)', async () => {
        if (!seedA || !seedB) throw new Error('seeds not initialized');

        // Build a payload that names org B as the owner. RLS USING
        // would not block the INSERT (USING is for SELECT/UPDATE/DELETE);
        // the WITH CHECK on FOR ALL / FOR INSERT is the only thing
        // standing between the attacker and a row injected under
        // someone else's tenant.
        const attackerPayload = spec.minimalInsert(seedB.orgId);
        const attackerClient = jwtClient(seedA);
        const { data, error } = await attackerClient
          .from(spec.table)
          .insert(attackerPayload)
          .select(spec.idColumn);

        if (error) {
          expect(error.message.toLowerCase()).toMatch(
            /permission|denied|policy|row-level|check/,
          );
        } else {
          // If no error, the row must NOT have actually been written
          // under org B. Verify as admin.
          expect(data ?? []).toHaveLength(0);
        }

        // Re-verify as admin — no orphan row was created under org B
        // attributed to seedA in the last 5 seconds.
        const after = await admin
          .from(spec.table)
          .select(spec.idColumn)
          .eq(spec.orgColumn, seedB.orgId);
        // beforeAll seeded exactly one org-B row (and fails the suite if it
        // couldn't). Anything more means the attacker's INSERT landed.
        expect(after.error).toBeNull();
        expect(after.data ?? []).toHaveLength(1);
      });

      it('user A cannot DELETE a row owned by org B (USING)', async () => {
        if (!seedA || !seedB) throw new Error('seeds not initialized');
        const orgBRow = await admin
          .from(spec.table)
          .select(spec.idColumn)
          .eq(spec.orgColumn, seedB.orgId)
          .single();
        // Same rule as the UPDATE probe: no seed row means no coverage, so
        // surface it as a failure instead of a silent pass.
        expect(orgBRow.error).toBeNull();
        expect(orgBRow.data).toBeTruthy();
        if (!orgBRow.data) return; // satisfies TS narrowing; unreachable

        const attackerClient = jwtClient(seedA);
        const targetId = (orgBRow.data as Record<string, unknown>)[
          spec.idColumn
        ] as string;
        const { error, data } = await attackerClient
          .from(spec.table)
          .delete()
          .eq(spec.idColumn, targetId)
          .select(spec.idColumn);

        if (error) {
          expect(error.message.toLowerCase()).toMatch(
            /permission|denied|policy|row-level/,
          );
        } else {
          expect(data ?? []).toHaveLength(0);
        }

        // Confirm the row still exists.
        const after = await admin
          .from(spec.table)
          .select(spec.idColumn)
          .eq(spec.idColumn, targetId)
          .maybeSingle();
        expect(after.data).not.toBeNull();
      });
    });
  }
});

if (!HAS_ENV) {
  describe('Audit 2026-05-26 adversarial RLS [skipped]', () => {
    it.skip('requires RUN_INTEGRATION_TESTS=1 and SUPABASE env vars to run live', () => {
      // intentionally empty
    });
  });
}
