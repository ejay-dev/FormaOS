/**
 * Tests for lib/admin/support-sla.ts
 */

jest.mock('server-only', () => ({}));

function createBuilder(result = { data: null, error: null, count: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockAdmin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdmin),
}));

import {
  calculateSLAStatus,
  getSLABreaches,
  getSLAMetrics,
} from '@/lib/admin/support-sla';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('calculateSLAStatus', () => {
  it('returns null when case not found', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: null, error: null, count: null }),
    );
    expect(await calculateSLAStatus('case-1')).toBeNull();
  });

  it('calculates on_track status for fresh case', async () => {
    const now = new Date();
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: {
            id: 'case-1',
            org_id: 'org-1',
            created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
            first_response_at: new Date(
              now.getTime() - 30 * 60 * 1000,
            ).toISOString(), // responded 30 min ago
            resolved_at: null,
            status: 'open',
            priority: 'medium',
          },
          error: null,
          count: null,
        });
      }
      return createBuilder({
        data: { plan: 'enterprise' },
        error: null,
        count: null,
      });
    });

    const result = await calculateSLAStatus('case-1');
    expect(result).toBeTruthy();
    expect(result!.response.responded).toBe(true);
    expect(result!.plan).toBe('enterprise');
    expect(result!.sla.responseHours).toBe(4);
    expect(result!.response.status).toBe('on_track');
  });

  it('detects breached response SLA', async () => {
    const now = new Date();
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: {
            id: 'case-1',
            org_id: 'org-1',
            created_at: new Date(
              now.getTime() - 72 * 60 * 60 * 1000,
            ).toISOString(), // 72 hours ago
            first_response_at: null,
            resolved_at: null,
            status: 'open',
            priority: 'high',
          },
          error: null,
          count: null,
        });
      }
      return createBuilder({
        data: { plan: 'starter' },
        error: null,
        count: null,
      });
    });

    const result = await calculateSLAStatus('case-1');
    expect(result!.response.status).toBe('breached');
    expect(result!.overall).toBe('breached');
  });

  it('detects at_risk response SLA', async () => {
    const now = new Date();
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: {
            id: 'case-1',
            org_id: 'org-1',
            // For starter plan: 48h response. 75% = 36h. So 40h is at_risk
            created_at: new Date(
              now.getTime() - 40 * 60 * 60 * 1000,
            ).toISOString(),
            first_response_at: null,
            resolved_at: null,
            status: 'open',
            priority: 'medium',
          },
          error: null,
          count: null,
        });
      }
      return createBuilder({
        data: { plan: 'starter' },
        error: null,
        count: null,
      });
    });

    const result = await calculateSLAStatus('case-1');
    expect(result!.response.status).toBe('at_risk');
    expect(result!.overall).toBe('at_risk');
  });

  it('detects breached resolution SLA', async () => {
    const now = new Date();
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: {
            id: 'case-1',
            org_id: 'org-1',
            // For pro: 3d resolution = 72h. 200 hours elapsed > 72h
            created_at: new Date(
              now.getTime() - 200 * 60 * 60 * 1000,
            ).toISOString(),
            first_response_at: new Date(
              now.getTime() - 199 * 60 * 60 * 1000,
            ).toISOString(),
            resolved_at: null,
            status: 'in_progress',
            priority: 'high',
          },
          error: null,
          count: null,
        });
      }
      return createBuilder({
        data: { plan: 'pro' },
        error: null,
        count: null,
      });
    });

    const result = await calculateSLAStatus('case-1');
    expect(result!.resolution.status).toBe('breached');
    expect(result!.overall).toBe('breached');
  });

  it('uses starter plan when org plan is unknown', async () => {
    const now = new Date();
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: {
            id: 'case-1',
            org_id: 'org-1',
            created_at: now.toISOString(),
            first_response_at: null,
            resolved_at: null,
            status: 'open',
            priority: 'low',
          },
          error: null,
          count: null,
        });
      }
      return createBuilder({ data: null, error: null, count: null });
    });

    const result = await calculateSLAStatus('case-1');
    expect(result!.sla.responseHours).toBe(48);
    expect(result!.sla.resolutionDays).toBe(5);
  });

  it('handles resolved case', async () => {
    const now = new Date();
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: {
            id: 'case-1',
            org_id: 'org-1',
            created_at: new Date(
              now.getTime() - 10 * 60 * 60 * 1000,
            ).toISOString(),
            first_response_at: new Date(
              now.getTime() - 9 * 60 * 60 * 1000,
            ).toISOString(),
            resolved_at: new Date(
              now.getTime() - 2 * 60 * 60 * 1000,
            ).toISOString(),
            status: 'resolved',
            priority: 'medium',
          },
          error: null,
          count: null,
        });
      }
      return createBuilder({
        data: { plan: 'pro' },
        error: null,
        count: null,
      });
    });

    const result = await calculateSLAStatus('case-1');
    expect(result!.resolution.resolved).toBe(true);
    expect(result!.response.responded).toBe(true);
  });
});

describe('getSLABreaches', () => {
  it('returns empty array when no cases', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: null }),
    );
    const breaches = await getSLABreaches();
    expect(breaches).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: null, error: null, count: null }),
    );
    const breaches = await getSLABreaches();
    expect(breaches).toEqual([]);
  });
});

describe('getSLAMetrics', () => {
  it('returns zero metrics when no cases', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: null }),
    );
    const metrics = await getSLAMetrics('2024-01-01', '2024-12-31');
    expect(metrics.totalCases).toBe(0);
    expect(metrics.avgResponseHours).toBe(0);
    expect(metrics.avgResolutionHours).toBe(0);
    expect(metrics.breachRate).toBe(0);
  });

  it('returns zero metrics when data is null', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: null, error: null, count: null }),
    );
    const metrics = await getSLAMetrics('2024-01-01', '2024-12-31');
    expect(metrics.totalCases).toBe(0);
  });
});
