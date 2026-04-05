/** @jest-environment node */
jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

jest.mock('@/lib/audit/readiness-calculator', () => ({
  calculateFrameworkReadiness: jest.fn().mockResolvedValue([
    {
      frameworkId: 'fw-1',
      frameworkCode: 'SOC2',
      frameworkTitle: 'SOC 2 Type II',
      readinessScore: 75,
      totalControls: 50,
      satisfiedControls: 35,
      missingControls: 10,
      partialControls: 5,
    },
  ]),
}));

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import { buildReport } from '@/lib/audit-reports/report-builder';

beforeEach(() => jest.clearAllMocks());

describe('buildReport', () => {
  it('builds trust packet report', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1)
        return createBuilder({ data: { name: 'Test Org' }, error: null }); // org
      if (callIdx === 2)
        return createBuilder({
          data: [{ verification_status: 'verified' }],
          error: null,
        }); // evidence
      if (callIdx === 3)
        return createBuilder({
          data: [{ status: 'completed', due_date: '2025-01-01' }],
          error: null,
        }); // tasks
      // critical gaps: controls
      return createBuilder({ data: [], error: null });
    });
    const result = await buildReport('org-1', 'trust' as any);
    expect(result).toHaveProperty('organizationName', 'Test Org');
    expect(result).toHaveProperty('readinessScore');
    expect(result).toHaveProperty('controlSummary');
    expect(result).toHaveProperty('evidenceSummary');
    expect(result).toHaveProperty('taskSummary');
  });

  it('builds SOC2 (default) report', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await buildReport('org-1', 'soc2' as any);
    expect(result).toHaveProperty('frameworkCode', 'SOC2');
    expect(result).toHaveProperty('frameworkName', 'SOC 2 Type II');
  });

  it('builds ISO 27001 report', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await buildReport('org-1', 'iso27001' as any);
    expect(result).toHaveProperty('readinessScore');
  });

  it('builds NDIS report', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await buildReport('org-1', 'ndis' as any);
    expect(result).toHaveProperty('readinessScore');
  });

  it('builds HIPAA report', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await buildReport('org-1', 'hipaa' as any);
    expect(result).toHaveProperty('readinessScore');
  });

  it('handles empty evidence and tasks', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await buildReport('org-1', 'trust' as any);
    expect(result.evidenceSummary.total).toBe(0);
    expect(result.taskSummary.total).toBe(0);
  });

  it('calculates control summary across all frameworks', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1)
        return createBuilder({ data: { name: 'Org' }, error: null });
      if (callIdx === 2) {
        return createBuilder({
          data: [
            { verification_status: 'verified' },
            { verification_status: 'pending' },
            { verification_status: 'rejected' },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null });
    });
    const result = await buildReport('org-1', 'trust' as any);
    expect(result.evidenceSummary.verified).toBe(1);
    expect(result.evidenceSummary.pending).toBe(1);
    expect(result.evidenceSummary.rejected).toBe(1);
  });
});
