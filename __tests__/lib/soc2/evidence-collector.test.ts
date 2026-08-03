/**
 * Tests for lib/soc2/evidence-collector.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'ilike',
    'not',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'in',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import { runAutomatedChecks } from '@/lib/soc2/evidence-collector';

beforeEach(() => jest.clearAllMocks());

describe('runAutomatedChecks', () => {
  function setupClient(tableResults: Record<string, any[]>) {
    const client = {
      from: jest.fn((table: string) => {
        const data = tableResults[table] ?? [];
        return createBuilder({ data, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    return client;
  }

  it('returns all passing when all evidence and policies exist', async () => {
    setupClient({
      org_policies: [{ id: 'p1' }],
      org_evidence: [{ id: 'e1' }],
    });

    const results = await runAutomatedChecks('org-1');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('returns failing checks when no policies or evidence exist', async () => {
    setupClient({});

    const results = await runAutomatedChecks('org-1');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => !r.passed)).toBe(true);
  });

  it('returns partial results when some evidence exists', async () => {
    // Only security policy exists but no evidence
    let callCount = 0;
    const client = {
      from: jest.fn((table: string) => {
        callCount++;
        // First few calls for SOC2-S1 (security policy) — return match
        if (table === 'org_policies' && callCount <= 2) {
          return createBuilder({ data: [{ id: 'p1' }], error: null });
        }
        // Everything else empty
        return createBuilder({ data: [], error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const results = await runAutomatedChecks('org-1');
    const passing = results.filter((r) => r.passed);
    const failing = results.filter((r) => !r.passed);
    expect(passing.length).toBeGreaterThan(0);
    expect(failing.length).toBeGreaterThan(0);
  });

  it('handles errors in individual checks gracefully', async () => {
    const client = {
      from: jest.fn(() => {
        throw new Error('DB connection failed');
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const results = await runAutomatedChecks('org-1');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => !r.passed)).toBe(true);
    expect(results[0].detail).toContain('Check failed');
  });

  it('each result has required fields', async () => {
    setupClient({});

    const results = await runAutomatedChecks('org-1');
    for (const r of results) {
      expect(r).toHaveProperty('checkName');
      expect(r).toHaveProperty('controlCode');
      expect(typeof r.passed).toBe('boolean');
      expect(typeof r.detail).toBe('string');
      expect(r).toHaveProperty('category');
    }
  });

  // Each check filters by an ilike title pattern, so drive the mock off the
  // pattern instead of a call index — the call order is an implementation
  // detail and an index-based mock silently drifts when checks are reordered.
  function setupPatternClient(
    matcher: (table: string, pattern: string) => any[],
  ) {
    const filters: Array<{ table: string; column: string; value: string }> = [];
    const client = {
      from: jest.fn((table: string) => {
        const b = createBuilder();
        let pattern = '';
        b.eq = jest.fn((column: string, value: string) => {
          filters.push({ table, column, value });
          return b;
        });
        b.ilike = jest.fn((_column: string, value: string) => {
          pattern = value;
          return b;
        });
        b.then = (resolve: (v: any) => void) =>
          resolve({ data: matcher(table, pattern), error: null });
        return b;
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    return { client, filters };
  }

  it('reports the missing half of the SOC2-S2 MFA check', async () => {
    // MFA evidence exists; access review evidence does not.
    setupPatternClient((table, pattern) =>
      table === 'org_evidence' && pattern === '%mfa%' ? [{ id: 'mfa1' }] : [],
    );

    const results = await runAutomatedChecks('org-1');
    const s2 = results.find((r) => r.controlCode === 'SOC2-S2');
    expect(s2).toBeDefined();
    expect(s2!.passed).toBe(false);
    expect(s2!.detail).toBe(
      'Missing: access review logs. Upload evidence with relevant titles.',
    );
  });

  it('lists both gaps when neither SOC2-S2 artifact exists', async () => {
    setupPatternClient(() => []);

    const results = await runAutomatedChecks('org-1');
    const s2 = results.find((r) => r.controlCode === 'SOC2-S2');
    expect(s2).toBeDefined();
    expect(s2!.detail).toBe(
      'Missing: MFA enforcement report, access review logs. Upload evidence with relevant titles.',
    );
  });

  it('passes SOC2-S2 when both MFA and access review evidence exist', async () => {
    setupPatternClient((table, pattern) =>
      table === 'org_evidence' &&
      (pattern === '%mfa%' || pattern === '%access review%')
        ? [{ id: 'ev1' }]
        : [],
    );

    const results = await runAutomatedChecks('org-1');
    const s2 = results.find((r) => r.controlCode === 'SOC2-S2');
    expect(s2).toBeDefined();
    expect(s2!.passed).toBe(true);
    expect(s2!.detail).toBe(
      'MFA enforcement report and access review evidence found.',
    );
  });

  it('scopes every check query to the requesting organization', async () => {
    const { filters } = setupPatternClient(() => []);

    await runAutomatedChecks('org-1');

    expect(filters.length).toBeGreaterThan(0);
    // The org-scoped client must stamp organization_id on every read; a
    // check that queried unfiltered would read another tenant's evidence.
    expect(
      filters.every(
        (f) => f.column === 'organization_id' && f.value === 'org-1',
      ),
    ).toBe(true);
  });
});
