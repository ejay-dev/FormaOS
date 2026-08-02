/**
 * Integration Tests for Onboarding Checklist API
 * Tests /api/onboarding/checklist endpoint
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { getChecklistCountsForOrg } from '@/lib/onboarding/checklist-data';

// Recording Supabase admin client mock.
//
// Audit 2026-08-03 — the previous mock returned immediately-resolved
// promises and threw away everything the implementation asked for, so the
// only things the suite could assert were the shape of a hard-coded zero
// response and two wall-clock thresholds that no amount of sequential I/O
// could ever breach. This version records the table, the selected columns
// and every `.eq()` filter of each query, and tracks how many queries are
// in flight simultaneously, so the tests below can assert the two things
// that actually matter: the org filter is applied to every read, and the
// count queries fan out in parallel.
const mockQueries: Array<{
  table: string;
  columns: string;
  filters: Array<[string, unknown]>;
}> = [];
const mockConcurrency = { inFlight: 0, max: 0 };
const mockErrorTables = new Set<string>();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => {
    const buildQuery = (table: string) => {
      const record = { table, columns: '*', filters: [] as Array<[string, unknown]> };
      mockQueries.push(record);

      const builder: any = {
        select: (columns?: string) => {
          record.columns = columns ?? '*';
          return builder;
        },
        eq: (column: string, value: unknown) => {
          record.filters.push([column, value]);
          return builder;
        },
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        // Thenable, deliberately settled on a macrotask so that every query
        // started inside the same Promise.all is observably in flight at the
        // same time. A sequential rewrite of getChecklistCountsForOrg would
        // drive mockConcurrency.max down to 1.
        then: (resolve: (value: any) => void) => {
          mockConcurrency.inFlight += 1;
          mockConcurrency.max = Math.max(
            mockConcurrency.max,
            mockConcurrency.inFlight,
          );
          return new Promise<void>((r) => setTimeout(r, 5)).then(() => {
            mockConcurrency.inFlight -= 1;
            resolve(
              mockErrorTables.has(table)
                ? { count: null, data: null, error: { message: `relation "${table}" boom` } }
                : { count: 0, data: [], error: null },
            );
          });
        },
      };

      return builder;
    };

    return { from: (table: string) => buildQuery(table) };
  }),
}));

function resetRecorder() {
  mockQueries.length = 0;
  mockConcurrency.inFlight = 0;
  mockConcurrency.max = 0;
  mockErrorTables.clear();
}

describe('Onboarding Checklist API - Integration', () => {
  const mockOrgId = 'test-org-123';

  beforeEach(() => {
    resetRecorder();
  });

  describe('getChecklistCountsForOrg', () => {
    it('should return all required count fields', async () => {
      const result = await getChecklistCountsForOrg(mockOrgId);

      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('members');
      expect(result).toHaveProperty('complianceChecks');
      expect(result).toHaveProperty('reports');
      expect(result).toHaveProperty('frameworks');
      expect(result).toHaveProperty('policies');
      expect(result).toHaveProperty('incidents');
      expect(result).toHaveProperty('registers');
      expect(result).toHaveProperty('workflows');
      expect(result).toHaveProperty('patients');
      expect(result).toHaveProperty('orgProfileComplete');
    });

    it('should return numbers for all count fields', async () => {
      const result = await getChecklistCountsForOrg(mockOrgId);

      expect(typeof result.tasks).toBe('number');
      expect(typeof result.evidence).toBe('number');
      expect(typeof result.members).toBe('number');
      expect(typeof result.complianceChecks).toBe('number');
      expect(typeof result.reports).toBe('number');
      expect(typeof result.frameworks).toBe('number');
      expect(typeof result.policies).toBe('number');
      expect(typeof result.incidents).toBe('number');
      expect(typeof result.registers).toBe('number');
      expect(typeof result.workflows).toBe('number');
      expect(typeof result.patients).toBe('number');
    });

    it('should return boolean for orgProfileComplete', async () => {
      const result = await getChecklistCountsForOrg(mockOrgId);

      expect(typeof result.orgProfileComplete).toBe('boolean');
    });

    it('should sum org_registers and org_assets into the registers count', async () => {
      // `registers` is the one derived field: registerRows + assetRows.
      // Asserting it against the two source queries catches a refactor that
      // drops one of them (the checklist step would silently stop
      // completing for orgs that only created assets).
      const result = await getChecklistCountsForOrg(mockOrgId);

      const tables = mockQueries.map((q) => q.table);
      expect(tables).toContain('org_registers');
      expect(tables).toContain('org_assets');
      expect(result.registers).toBe(0);
    });
  });

  describe('orgProfileComplete calculation', () => {
    it('should be false when org data is missing', async () => {
      const result = await getChecklistCountsForOrg(mockOrgId);

      // With mocked empty data, orgProfileComplete should be false
      expect(result.orgProfileComplete).toBe(false);
    });

    it('should read name, industry, team_size and plan_key from organizations', async () => {
      // The previous version of this test asserted `false` twice and never
      // looked at the query, so a refactor that stopped reading the org row
      // entirely would still have passed.
      await getChecklistCountsForOrg(mockOrgId);

      const orgQuery = mockQueries.find((q) => q.table === 'organizations');
      expect(orgQuery).toBeDefined();
      expect(orgQuery!.columns.split(',').map((c) => c.trim()).sort()).toEqual([
        'industry',
        'name',
        'plan_key',
        'team_size',
      ]);
      expect(orgQuery!.filters).toContainEqual(['id', mockOrgId]);
    });
  });

  describe('Error handling', () => {
    it('should return 0 for a count whose query errors', async () => {
      // safeCount() swallows the PostgREST error and returns 0. Previously
      // this test asserted 0 against a mock that never errored, so it proved
      // nothing; now the failure is injected.
      mockErrorTables.add('org_tasks');
      mockErrorTables.add('org_evidence');

      const result = await getChecklistCountsForOrg(mockOrgId);

      expect(result.tasks).toBe(0);
      expect(result.evidence).toBe(0);
      // Non-failing tables must still be counted rather than short-circuited
      // by the sibling failure.
      expect(mockQueries.map((q) => q.table)).toContain('org_members');
      expect(result.members).toBe(0);
    });

    it('should still resolve every field when every count query errors', async () => {
      for (const table of [
        'org_tasks',
        'org_evidence',
        'org_members',
        'org_control_evaluations',
        'reports',
        'org_frameworks',
        'org_policies',
        'org_incidents',
        'org_registers',
        'org_assets',
        'org_workflows',
        'org_patients',
      ]) {
        mockErrorTables.add(table);
      }

      const result = await getChecklistCountsForOrg('nonexistent-org-id');

      expect(result).toBeDefined();
      expect(result.tasks).toBe(0);
      expect(result.registers).toBe(0);
      expect(result.orgProfileComplete).toBe(false);
    });
  });
});

describe('Checklist API Endpoint - HTTP', () => {
  // Audit 2026-05-26 — placeholders converted from `expect(true).toBe(true)`
  // to `test.todo` so Jest reports them as pending in the test summary
  // rather than as "passing tests with no coverage". The underlying work
  // still belongs in this file but the misleading green badge is gone.

  describe('GET /api/onboarding/checklist', () => {
    test.todo('should return 200 with valid session');
    test.todo('should return all count fields in response');
    test.todo('should return 401 without authentication');
    test.todo('should return 404 for missing org');
  });
});

describe('RLS Policy Validation', () => {
  describe('Role-based access', () => {
    test.todo('should allow owner to access all counts');
    test.todo('should allow admin to access all counts');
    test.todo('should allow member to access counts (read-only)');
    test.todo('should allow viewer to access counts (read-only)');
  });
});

describe('Tenant scoping', () => {
  // Column names verified against the production database
  // (project bvfniosswcvuyfaaicze) on 2026-08-03 via information_schema.
  // org_registers is the drifted one: it carries `org_id`, every other
  // table here carries `organization_id`, and `organizations` is scoped by
  // its own primary key. If lib/supabase/org-scoped.ts ever binds the wrong
  // column for one of these tables, the generated filter silently matches
  // nothing (reads) or, for a service-role write, escapes the tenant.
  const EXPECTED_TENANT_COLUMN: Record<string, string> = {
    org_tasks: 'organization_id',
    org_evidence: 'organization_id',
    org_members: 'organization_id',
    org_control_evaluations: 'organization_id',
    reports: 'organization_id',
    org_frameworks: 'organization_id',
    org_policies: 'organization_id',
    org_incidents: 'organization_id',
    org_registers: 'org_id',
    org_assets: 'organization_id',
    org_workflows: 'organization_id',
    org_patients: 'organization_id',
    organizations: 'id',
  };

  const scopedOrgId = 'org-scoping-abc';

  beforeEach(() => {
    resetRecorder();
  });

  it('filters every query by the requesting org on the column that exists in prod', async () => {
    await getChecklistCountsForOrg(scopedOrgId);

    expect(mockQueries.length).toBeGreaterThan(0);

    for (const query of mockQueries) {
      // Fails loudly rather than silently skipping an unrecognised table:
      // a new table joining the checklist must be schema-verified too.
      expect(Object.keys(EXPECTED_TENANT_COLUMN)).toContain(query.table);
      const expectedColumn = EXPECTED_TENANT_COLUMN[query.table];
      expect(query.filters).toContainEqual([expectedColumn, scopedOrgId]);
    }
  });

  it('never issues a query filtered by a different org id', async () => {
    await getChecklistCountsForOrg(scopedOrgId);

    const tenantColumns = new Set(Object.values(EXPECTED_TENANT_COLUMN));
    for (const query of mockQueries) {
      for (const [column, value] of query.filters) {
        if (tenantColumns.has(column)) {
          expect(value).toBe(scopedOrgId);
        }
      }
    }
  });

  it('queries only the tables that exist in production', async () => {
    await getChecklistCountsForOrg(scopedOrgId);

    const queried = Array.from(new Set(mockQueries.map((q) => q.table))).sort();
    expect(queried).toEqual(Object.keys(EXPECTED_TENANT_COLUMN).sort());
  });

  it('counts a column that exists on every table it counts', async () => {
    // Verified against prod 2026-08-03: org_frameworks has exactly three
    // columns — organization_id, framework_slug, enabled_at. There is no
    // `id`. `select('id', { count: 'exact', head: true })` therefore returns
    // PostgREST 42703, safeCount() swallows it, and the checklist's
    // `frameworks` count is pinned at 0 for every org in production, so the
    // "connect a framework" step can never complete.
    //
    // This assertion fails until lib/onboarding/checklist-data.ts counts an
    // existing column on org_frameworks (e.g. 'organization_id').
    const COLUMNLESS_OF_ID = new Set(['org_frameworks']);

    await getChecklistCountsForOrg(scopedOrgId);

    for (const query of mockQueries) {
      if (query.table === 'organizations') continue;
      if (COLUMNLESS_OF_ID.has(query.table)) {
        expect(query.columns).not.toBe('id');
      } else {
        expect(query.columns).toBe('id');
      }
    }
  });
});

describe('Query fan-out', () => {
  const perfTestOrgId = 'perf-test-org-123';

  beforeEach(() => {
    resetRecorder();
  });

  it('issues every count query concurrently rather than one after another', async () => {
    // Audit 2026-08-03 — replaces two wall-clock assertions (`duration <
    // 2000ms` / `< 3000ms`) taken against a fully mocked client. No I/O
    // happened, so the measured duration was sub-millisecond and the
    // thresholds could not be violated however many sequential round-trips
    // the implementation made. This asserts the property those thresholds
    // were standing in for: the checklist's count queries are all in flight
    // at the same time. Converting the Promise.all in
    // getChecklistCountsForOrg into sequential awaits drops max to 1.
    await getChecklistCountsForOrg(perfTestOrgId);

    const countQueries = mockQueries.filter((q) => q.table !== 'organizations');

    expect(countQueries.length).toBeGreaterThanOrEqual(15);
    expect(mockConcurrency.max).toBe(countQueries.length);
    expect(mockConcurrency.inFlight).toBe(0);
  });

  it('does not re-query the org row for each count', async () => {
    await getChecklistCountsForOrg(perfTestOrgId);

    const orgQueries = mockQueries.filter((q) => q.table === 'organizations');
    expect(orgQueries).toHaveLength(1);
  });
});
