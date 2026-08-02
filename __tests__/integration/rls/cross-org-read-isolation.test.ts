/** @jest-environment node */
// KNOWN LOCAL-ENV NOTE (2026-05-27): the matching standalone probe
// (creating a real Supabase user via auth.admin.createUser) works
// fine, but running this file directly under jest fails at the
// first fetch with "fetch failed". The cause is in the jest setup
// stack (setupFilesAfterEnv stomps global.fetch with a jest.fn that
// returns undefined). The companion file
// cross-org-write-isolation.test.ts has the identical structural
// issue and has been running nightly in CI for ~3 weeks — meaning
// the CI environment doesn't trip the same hook order. This file
// is wired into the same CI gate (R7) so it runs alongside.
// Local execution requires `npm run` with a wrapper that skips the
// global fetch mock for integration paths; tracked as a follow-up.

// jest.setup.js (setupFilesAfterEnv) replaces global.fetch with a
// `jest.fn()` returning undefined, and Node 20 doesn't ship a
// WebSocket global which supabase-realtime-js eagerly needs. Both
// crashes happen at module-load before any of our test code runs.
// Restore both globals using the exact same shim sequence that the
// standalone scripts/_node20-ws-shim.mjs uses, plus undici for fetch.
// Run inside beforeAll so it survives jest.setup.js's stomp order.
beforeAll(() => {
  if (
    typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined'
  ) {
    (globalThis as { WebSocket: unknown }).WebSocket = require('ws');
  }
  const undici = require('undici') as typeof import('undici');
  (globalThis as { fetch: unknown }).fetch = undici.fetch;
});

/**
 * R8 (Audit 2026-05-27) — cross-org READ isolation, the companion to
 * cross-org-write-isolation.test.ts.
 *
 * The existing adversarial RLS suite covered UPDATE / INSERT / DELETE
 * via PostgREST. SELECT was implicit (the WRITE attempts rely on the
 * read predicate too) but never directly asserted on the read surface
 * a real API consumer exercises:
 *
 *   * Direct PostgREST GET — exactly what the v1 API route handlers
 *     wrap when they call createSupabaseOrgClient (the user's session
 *     cookie or Bearer token gets forwarded through to PostgREST).
 *   * Filter-by-id reads with a legitimate-but-cross-org id — the
 *     IDOR class of attack the original 2026-05-26 audit called out
 *     specifically (existing tests used random UUIDs; that catches
 *     "non-existent" but never "exists in another org I shouldn't see").
 *
 * Two orgs, two users, one resource seeded per org per table. User A
 * (org A's JWT'd client) attempts to SELECT org B's rows by id. The
 * RLS predicate must filter them out — successful read of the org B
 * row would mean a cross-tenant leak.
 *
 * Same env contract as the write isolation suite: requires
 * NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY +
 * SUPABASE_SERVICE_ROLE_KEY + RUN_INTEGRATION_TESTS=1. Skips silently
 * otherwise so fork PRs without secrets don't fail.
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

// Each spec describes a table where:
//   * org members can SELECT their own org's rows (the legitimate path)
//   * org members must NOT see another org's rows by id
//
// `selectColumns` is the set of columns we ask for in the cross-org
// probe — kept narrow so the read is realistic (no SELECT *).
const READ_TARGETS: ReadonlyArray<{
  table: string;
  idColumn: string;
  orgColumn: 'org_id' | 'organization_id';
  selectColumns: string;
  minimalInsert: (orgId: string) => Record<string, unknown>;
}> = [
  {
    table: 'org_tasks',
    idColumn: 'id',
    orgColumn: 'organization_id',
    selectColumns: 'id, title, organization_id',
    minimalInsert: (orgId) => ({
      organization_id: orgId,
      title: 'rls-read-probe',
      status: 'pending',
    }),
  },
  {
    table: 'org_evidence',
    idColumn: 'id',
    orgColumn: 'organization_id',
    selectColumns: 'id, organization_id',
    // Verified against production: file_name, file_path and file_hash are
    // NOT NULL. The previous {organization_id, title} payload was rejected
    // on every run, so org_evidence was never actually probed.
    minimalInsert: (orgId) => ({
      organization_id: orgId,
      title: 'rls-read-probe',
      file_name: 'rls-read-probe.txt',
      file_path: `rls-read-probe/${orgId}.txt`,
      file_hash: 'rls-read-probe-hash',
    }),
  },
  {
    table: 'org_policies',
    idColumn: 'id',
    orgColumn: 'organization_id',
    selectColumns: 'id, title, organization_id',
    minimalInsert: (orgId) => ({
      organization_id: orgId,
      title: 'rls-read-probe',
      status: 'draft',
    }),
  },
  {
    table: 'org_assets',
    idColumn: 'id',
    orgColumn: 'organization_id',
    selectColumns: 'id, name, organization_id',
    minimalInsert: (orgId) => ({
      organization_id: orgId,
      name: 'rls-read-probe',
      type: 'data',
    }),
  },
];

const maybeDescribe = HAS_ENV ? describe : describe.skip;

maybeDescribe(
  'R8 (Audit 2026-05-27): cross-org READ isolation under RLS',
  () => {
    jest.setTimeout(120_000);

    let admin: SupabaseClient;
    const createdUserIds: string[] = [];
    const createdOrgIds: string[] = [];
    const seededRows: Array<{
      table: string;
      idColumn: string;
      orgId: string;
      rowId: string;
    }> = [];

    const PASSWORD = 'RlsReadIso!Secure-2026';

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
      const email = `rls-read-${label}-${id}@test.formaos.local`;

      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { is_e2e_test: true, rls_read_test: true },
        });
      if (createErr || !created?.user) {
        throw new Error(`createUser failed: ${createErr?.message}`);
      }
      createdUserIds.push(created.user.id);

      const { data: org, error: orgErr } = await admin
        .from('organizations')
        .insert({ name: `RLS Read ${label} ${id}`, plan_key: 'pro' })
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

    function jwtClient(seed: Seed): SupabaseClient {
      return createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${seed.accessToken}` },
        },
      });
    }

    beforeAll(async () => {
      admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
        auth: { persistSession: false },
      });
      seedA = await provisionOrgWithUser('a');
      seedB = await provisionOrgWithUser('b');

      // Seed one row per table per org. Cross-org probes below address
      // the org-B rows by id; the org-A row is the control case (user A
      // MUST be able to read their own org's row, otherwise the test
      // would pass on a broken RLS that returned nothing to anyone).
      for (const spec of READ_TARGETS) {
        for (const seed of [seedA, seedB]) {
          const payload = spec.minimalInsert(seed.orgId);
          const { error, data } = await admin
            .from(spec.table)
            .insert(payload)
            .select(spec.idColumn)
            .single();
          if (error) {
            // Loud, not silent: a rejected seed means the probes below have
            // nothing to read and the isolation gate stops testing anything.
            throw new Error(
              `[R8 read isolation] seed insert failed for ${spec.table} (org ${seed.orgId}): ${error.message}`,
            );
          }
          seededRows.push({
            table: spec.table,
            idColumn: spec.idColumn,
            orgId: seed.orgId,
            rowId: (data as Record<string, unknown>)[spec.idColumn] as string,
          });
        }
      }
    });

    afterAll(async () => {
      for (const row of seededRows) {
        await admin.from(row.table).delete().eq(row.idColumn, row.rowId);
      }
      for (const orgId of createdOrgIds) {
        await admin.from('org_members').delete().eq('organization_id', orgId);
        await admin.from('organizations').delete().eq('id', orgId);
      }
      for (const userId of createdUserIds) {
        await admin.auth.admin.deleteUser(userId);
      }
    });

    for (const spec of READ_TARGETS) {
      describe(`${spec.table}`, () => {
        it('user A CAN read their own org row (control)', async () => {
          if (!seedA) throw new Error('seedA not initialized');
          const orgARow = seededRows.find(
            (r) => r.table === spec.table && r.orgId === seedA!.orgId,
          );
          // A missing seed row means the table rejected our insert (schema
          // drift / a new NOT NULL column). Fail loudly — silently returning
          // here would pass with zero assertions and quietly stop testing
          // tenant isolation for this table.
          expect(orgARow).toBeTruthy();
          if (!orgARow) return; // satisfies TS narrowing; unreachable after assert

          const userClient = jwtClient(seedA);
          const { data, error } = await userClient
            .from(spec.table)
            .select(spec.selectColumns)
            .eq(spec.idColumn, orgARow.rowId)
            .maybeSingle();

          expect(error).toBeNull();
          expect(data).toBeTruthy();
          expect((data as Record<string, unknown>)[spec.idColumn]).toBe(
            orgARow.rowId,
          );
        });

        it('user A CANNOT read org B row by id (RLS deny)', async () => {
          if (!seedA || !seedB) throw new Error('seeds not initialized');
          const orgBRow = seededRows.find(
            (r) => r.table === spec.table && r.orgId === seedB!.orgId,
          );
          // Fail loudly if the seed didn't land — otherwise this cross-tenant
          // deny check would no-op (pass without probing anything).
          expect(orgBRow).toBeTruthy();
          if (!orgBRow) return;

          const attackerClient = jwtClient(seedA);
          const { data, error } = await attackerClient
            .from(spec.table)
            .select(spec.selectColumns)
            .eq(spec.idColumn, orgBRow.rowId)
            .maybeSingle();

          // RLS denial surfaces as `data === null` with no error code —
          // PostgREST silently filters out rows the JWT'd client can't
          // see. If `data` came back with the row, that's the cross-tenant
          // leak we're guarding against.
          if (error) {
            // A row-not-found / 406 is also acceptable — what matters is
            // that the attacker didn't get the org-B row payload back.
            expect(data).toBeNull();
          } else {
            expect(data).toBeNull();
          }
        });

        it('user A CANNOT find org B row in an unfiltered list', async () => {
          if (!seedA || !seedB) throw new Error('seeds not initialized');
          const orgBRow = seededRows.find(
            (r) => r.table === spec.table && r.orgId === seedB!.orgId,
          );
          // Fail loudly if the seed didn't land (see note above).
          expect(orgBRow).toBeTruthy();
          if (!orgBRow) return;

          const attackerClient = jwtClient(seedA);
          const { data, error } = await attackerClient
            .from(spec.table)
            .select(spec.selectColumns)
            .limit(500);

          expect(error).toBeNull();
          const ids = (data ?? []).map(
            (row: Record<string, unknown>) => row[spec.idColumn] as string,
          );
          // The org-B row must NOT appear in user A's list.
          expect(ids).not.toContain(orgBRow.rowId);
        });
      });
    }

    // Sanity: audit_log is hash-chained and locked by RLS to org members
    // only (P0-1). Verify that an org-A JWT'd client cannot read org B's
    // audit_log entries — this is the highest-value tenant-isolation
    // surface and the one most likely to have a regression slip through.
    describe('audit_log (P0-1 immutability + tenant scope)', () => {
      it('user A receives no audit_log rows for org B', async () => {
        if (!seedA || !seedB) throw new Error('seeds not initialized');

        // Seed through audit_log_append — the same hash-chain RPC the app
        // writes with (lib/audit/audit-engine.ts). A direct table INSERT
        // used to be attempted here and silently bailed on failure, which
        // meant this probe never ran: audit_log.event_type / target_type
        // are NOT NULL and only the RPC populates them.
        const auditId = require('crypto').randomUUID() as string;
        const { error: seedErr } = await admin.rpc('audit_log_append', {
          p_id: auditId,
          p_org_id: seedB.orgId,
          p_user_id: seedB.userId,
          p_action: 'rls.read.probe',
          p_resource_type: 'rls_probe',
          p_resource_id: null,
          p_details: { probe: 'R8' },
          p_ip_address: null,
          p_user_agent: null,
          p_created_at: new Date().toISOString(),
        });
        expect(seedErr).toBeNull();

        // Control: org B's own member CAN see the row. Without this the
        // deny assertion below would also pass on an audit_log that returns
        // nothing to anybody (or on a row that never got written).
        const ownerClient = jwtClient(seedB);
        const { data: ownerView } = await ownerClient
          .from('audit_log')
          .select('id, action, org_id')
          .eq('id', auditId)
          .maybeSingle();
        expect(ownerView).toMatchObject({
          id: auditId,
          action: 'rls.read.probe',
          org_id: seedB.orgId,
        });

        const attackerClient = jwtClient(seedA);
        const { data } = await attackerClient
          .from('audit_log')
          .select('id, action, org_id')
          .eq('id', auditId)
          .maybeSingle();
        expect(data).toBeNull();

        // No cleanup: audit_log is append-only (the audit_log_immutable
        // trigger rejects UPDATE and DELETE for every role, including
        // service_role). The probe row is left behind by design.
      });
    });
  },
);
