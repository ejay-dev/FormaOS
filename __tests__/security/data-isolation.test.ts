/** @jest-environment node */
/**
 * Multi-Tenancy Data Isolation Tests
 *
 * These exercise the REAL tenant-scoping code paths — the org-scoped
 * Supabase wrapper (lib/supabase/org-scoped.ts) and a query-layer reader
 * (lib/data/audit-logs.ts) — against an in-memory database that does NOT
 * filter by itself. Postgres RLS cannot be exercised from Jest, and the
 * service-role client bypasses it anyway, so the filters this code emits
 * are the control under test: remove one and a cross-org read succeeds,
 * which fails these tests.
 *
 * The previous version of this file simulated RLS with a test-local
 * `rlsFilter()` and then asserted that filter's output, so no production
 * code was involved at all. It also seeded tables (`obligations`,
 * `incidents`, `participants`) that do not exist in the database.
 */

jest.mock('server-only', () => ({}));

type Row = Record<string, unknown>;

// Seeded to mirror real schema: these tables key tenancy off
// organization_id (verified against the production schema).
let tables: Record<string, Row[]> = {};

function seed() {
  tables = {
    org_evidence: [
      {
        id: 'ev-a1',
        organization_id: 'org-a',
        file_name: 'policy.pdf',
        title: 'Policy',
      },
      {
        id: 'ev-a2',
        organization_id: 'org-a',
        file_name: 'training.pdf',
        title: 'Training',
      },
      {
        id: 'ev-b1',
        organization_id: 'org-b',
        file_name: 'audit-report.pdf',
        title: 'Audit',
      },
    ],
    org_members: [
      { id: 'mem-a1', organization_id: 'org-a', user_id: 'user-a', role: 'owner' },
      { id: 'mem-a2', organization_id: 'org-a', user_id: 'user-a2', role: 'member' },
      { id: 'mem-b1', organization_id: 'org-b', user_id: 'user-b', role: 'owner' },
    ],
    org_tasks: [
      { id: 'task-a1', organization_id: 'org-a', title: 'SOC 2 Audit' },
      { id: 'task-b1', organization_id: 'org-b', title: 'GDPR Compliance' },
    ],
    org_audit_logs: [
      {
        id: 'log-a1',
        organization_id: 'org-a',
        action: 'evidence.upload',
        created_at: '2026-01-02T00:00:00Z',
      },
      {
        id: 'log-a2',
        organization_id: 'org-a',
        action: 'member.invite',
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'log-b1',
        organization_id: 'org-b',
        action: 'policy.publish',
        created_at: '2026-01-03T00:00:00Z',
      },
    ],
  };
}

/**
 * In-memory stand-in for PostgREST + a service-role connection: it applies
 * exactly the filters it is given and nothing more. An unfiltered select
 * therefore returns every tenant's rows — the same as a service-role query
 * that forgot its org filter.
 */
function createFakeDb() {
  function makeQuery(table: string) {
    const filters: Array<[string, unknown]> = [];
    let mode: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
    let payload: Row | Row[] | null = null;

    const rows = () => (tables[table] ??= []);
    const matches = (row: Row) =>
      filters.every(([column, value]) => row[column] === value);

    const run = () => {
      if (mode === 'insert' || mode === 'upsert') {
        const list = Array.isArray(payload) ? payload : [payload as Row];
        rows().push(...list.map((r) => ({ ...r })));
        return { data: list, error: null };
      }
      if (mode === 'update') {
        const hit = rows().filter(matches);
        for (const row of hit) Object.assign(row, payload);
        return { data: hit, error: null };
      }
      if (mode === 'delete') {
        const removed = rows().filter(matches);
        tables[table] = rows().filter((r) => !matches(r));
        return { data: removed, error: null };
      }
      return { data: rows().filter(matches), error: null };
    };

    const builder: Record<string, any> = {
      select: () => builder,
      insert: (values: Row | Row[]) => {
        mode = 'insert';
        payload = values;
        return builder;
      },
      update: (values: Row) => {
        mode = 'update';
        payload = values;
        return builder;
      },
      upsert: (values: Row | Row[]) => {
        mode = 'upsert';
        payload = values;
        return builder;
      },
      delete: () => {
        mode = 'delete';
        return builder;
      },
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return builder;
      },
      in: (column: string, values: unknown[]) => {
        filters.push([column, values[0]]);
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      single: () => Promise.resolve({ data: run().data?.[0] ?? null, error: null }),
      maybeSingle: () =>
        Promise.resolve({ data: run().data?.[0] ?? null, error: null }),
      then: (resolve: (v: unknown) => void) => resolve(run()),
    };

    return builder;
  }

  return { from: (table: string) => makeQuery(table) };
}

const fakeDb = createFakeDb();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => fakeDb,
}));

jest.mock('@/lib/supabase/server', () => ({
  __esModule: true,
  createSupabaseServerClient: jest.fn(() => Promise.resolve(fakeDb)),
}));

import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { getAuditLogs } from '@/lib/data/audit-logs';

beforeEach(() => {
  seed();
  jest.clearAllMocks();
});

describe('Multi-Tenancy Data Isolation', () => {
  // ---------------------------------------------------------------
  // Harness guard: the fake DB filters only when asked to, so every
  // assertion below depends on production code emitting the filter.
  // ---------------------------------------------------------------
  it('an unfiltered read really does return every tenant (harness guard)', async () => {
    const { data } = (await fakeDb.from('org_evidence').select('*')) as {
      data: Row[];
    };

    expect(data).toHaveLength(3);
    expect(new Set(data.map((r) => r.organization_id))).toEqual(
      new Set(['org-a', 'org-b']),
    );
  });

  describe('org-scoped reads', () => {
    it('Org A reads only its own evidence', async () => {
      const supabase = createSupabaseOrgClient('org-a');
      const { data } = (await supabase.from('org_evidence').select('*')) as {
        data: Row[];
      };

      expect(data).toHaveLength(2);
      expect(data.every((r) => r.organization_id === 'org-a')).toBe(true);
      expect(data.find((r) => r.id === 'ev-b1')).toBeUndefined();
    });

    it('Org B reads only its own evidence', async () => {
      const supabase = createSupabaseOrgClient('org-b');
      const { data } = (await supabase.from('org_evidence').select('*')) as {
        data: Row[];
      };

      expect(data).toEqual([expect.objectContaining({ id: 'ev-b1' })]);
    });

    it('an org with no rows reads nothing rather than everything', async () => {
      const supabase = createSupabaseOrgClient('org-c');
      const { data } = (await supabase.from('org_evidence').select('*')) as {
        data: Row[];
      };

      expect(data).toEqual([]);
    });

    it('membership rows do not cross tenants', async () => {
      const orgA = createSupabaseOrgClient('org-a');
      const orgB = createSupabaseOrgClient('org-b');

      const { data: aMembers } = (await orgA
        .from('org_members')
        .select('*')) as { data: Row[] };
      const { data: bMembers } = (await orgB
        .from('org_members')
        .select('*')) as { data: Row[] };

      expect(aMembers.map((r) => r.id)).toEqual(['mem-a1', 'mem-a2']);
      expect(bMembers.map((r) => r.id)).toEqual(['mem-b1']);
    });

    it('an extra caller filter narrows within the tenant, it does not widen it', async () => {
      const supabase = createSupabaseOrgClient('org-a');
      // Ask for a row that belongs to org-b by primary key.
      const { data } = (await supabase
        .from('org_evidence')
        .select('*')
        .eq('id', 'ev-b1')) as { data: Row[] };

      expect(data).toEqual([]);
    });
  });

  describe('org-scoped writes', () => {
    it('inserts are stamped with the caller org', async () => {
      const supabase = createSupabaseOrgClient('org-a');
      await supabase.from('org_tasks').insert({ id: 'task-new', title: 'New' });

      expect(tables.org_tasks).toContainEqual({
        id: 'task-new',
        title: 'New',
        organization_id: 'org-a',
      });
    });

    it('an update cannot reach another tenant row', async () => {
      const supabase = createSupabaseOrgClient('org-a');
      await supabase
        .from('org_tasks')
        .update({ title: 'Hijacked' })
        .eq('id', 'task-b1');

      expect(
        tables.org_tasks.find((r) => r.id === 'task-b1')!.title,
      ).toBe('GDPR Compliance');
    });

    it('an update cannot move a row into another tenant', async () => {
      const supabase = createSupabaseOrgClient('org-a');
      await supabase
        .from('org_tasks')
        .update({ title: 'Renamed', organization_id: 'org-b' })
        .eq('id', 'task-a1');

      const row = tables.org_tasks.find((r) => r.id === 'task-a1')!;
      expect(row.title).toBe('Renamed');
      expect(row.organization_id).toBe('org-a');
    });

    it('a delete cannot remove another tenant row', async () => {
      const supabase = createSupabaseOrgClient('org-a');
      await supabase.from('org_tasks').delete().eq('id', 'task-b1');

      expect(tables.org_tasks.map((r) => r.id)).toContain('task-b1');
    });

    it('a delete removes the caller own row', async () => {
      const supabase = createSupabaseOrgClient('org-a');
      await supabase.from('org_tasks').delete().eq('id', 'task-a1');

      expect(tables.org_tasks.map((r) => r.id)).toEqual(['task-b1']);
    });
  });

  describe('fail-closed registry', () => {
    it('refuses an unregistered table instead of reading it unscoped', () => {
      const supabase = createSupabaseOrgClient('org-a');

      expect(() => supabase.from('security_events')).toThrow(
        /not registered as a tenant table/,
      );
    });

    it('refuses to build a client without an org id', () => {
      expect(() => createSupabaseOrgClient('')).toThrow(/orgId is required/);
    });
  });

  describe('query layer — getAuditLogs', () => {
    it('returns only the requested org audit logs', async () => {
      const logs = (await getAuditLogs('org-a')) as Row[];

      expect(logs).toHaveLength(2);
      expect(logs.every((r) => r.organization_id === 'org-a')).toBe(true);
      expect(logs.find((r) => r.id === 'log-b1')).toBeUndefined();
    });

    it('returns nothing for an org with no logs', async () => {
      const logs = (await getAuditLogs('org-c')) as Row[];

      expect(logs).toEqual([]);
    });
  });
});
