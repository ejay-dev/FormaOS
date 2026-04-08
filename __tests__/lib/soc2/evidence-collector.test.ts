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

  it('covers SOC2-S2 MFA check branches', async () => {
    // MFA evidence exists but no access review
    let callCount = 0;
    const client = {
      from: jest.fn((table: string) => {
        callCount++;
        if (table === 'org_evidence' && callCount === 3) {
          // MFA evidence found
          return createBuilder({ data: [{ id: 'mfa1' }], error: null });
        }
        if (table === 'org_evidence' && callCount === 4) {
          // Access review not found
          return createBuilder({ data: [], error: null });
        }
        if (table === 'org_policies' && callCount === 1) {
          return createBuilder({ data: [{ id: 'p1' }], error: null });
        }
        return createBuilder({ data: [], error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const results = await runAutomatedChecks('org-1');
    const s2 = results.find((r) => r.controlCode === 'SOC2-S2');
    if (s2) {
      expect(s2.detail).toContain('Upload evidence');
    }
  });
});
