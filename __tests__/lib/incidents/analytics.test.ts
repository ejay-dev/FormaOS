/**
 * Tests for lib/incidents/analytics.ts
 */

const mockFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({ from: mockFrom })),
}));

import {
  getIncidentStats,
  getIncidentTrend,
  getMTTR,
} from '@/lib/incidents/analytics';

beforeEach(() => {
  jest.clearAllMocks();
});

function mockQuery(data: any[] | null) {
  const result = { data, error: null };
  const chain: any = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.gte = jest.fn().mockReturnValue(chain);
  chain.lte = jest.fn().mockReturnValue(chain);
  chain.not = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  // Supabase builder is thenable — await resolves via .then()
  chain.then = jest.fn((resolve: Function) => resolve(result));
  mockFrom.mockReturnValue(chain);
  return chain;
}

const dateRange = { from: '2026-01-01', to: '2026-03-31' };

describe('getIncidentStats', () => {
  it('returns zero totals when no incidents', async () => {
    mockQuery(null);
    const result = await getIncidentStats('org1', dateRange);
    expect(result).toEqual({
      byType: {},
      bySeverity: {},
      byStatus: {},
      total: 0,
    });
  });

  it('returns zero totals when empty array', async () => {
    mockQuery([]);
    const result = await getIncidentStats('org1', dateRange);
    expect(result.total).toBe(0);
  });

  it('aggregates incidents by type, severity, and status', async () => {
    mockQuery([
      {
        id: '1',
        type: 'data_breach',
        severity: 'high',
        status: 'open',
        created_at: '2026-01-15',
        resolved_at: null,
      },
      {
        id: '2',
        type: 'data_breach',
        severity: 'medium',
        status: 'resolved',
        created_at: '2026-02-01',
        resolved_at: '2026-02-05',
      },
      {
        id: '3',
        type: 'unauthorized_access',
        severity: 'high',
        status: 'open',
        created_at: '2026-02-10',
        resolved_at: null,
      },
    ]);

    const result = await getIncidentStats('org1', dateRange);
    expect(result.total).toBe(3);
    expect(result.byType).toEqual({ data_breach: 2, unauthorized_access: 1 });
    expect(result.bySeverity).toEqual({ high: 2, medium: 1 });
    expect(result.byStatus).toEqual({ open: 2, resolved: 1 });
  });

  it('handles single incident', async () => {
    mockQuery([
      {
        id: '1',
        type: 'policy_violation',
        severity: 'low',
        status: 'closed',
        created_at: '2026-01-01',
        resolved_at: '2026-01-02',
      },
    ]);
    const result = await getIncidentStats('org1', dateRange);
    expect(result.total).toBe(1);
    expect(result.byType).toEqual({ policy_violation: 1 });
  });
});

describe('getIncidentTrend', () => {
  it('returns empty array when no incidents', async () => {
    mockQuery(null);
    const result = await getIncidentTrend('org1', dateRange, 'month');
    expect(result).toEqual([]);
  });

  it('groups by month', async () => {
    mockQuery([
      { id: '1', created_at: '2026-01-15T00:00:00Z' },
      { id: '2', created_at: '2026-01-20T00:00:00Z' },
      { id: '3', created_at: '2026-02-05T00:00:00Z' },
    ]);

    const result = await getIncidentTrend('org1', dateRange, 'month');
    expect(result).toEqual([
      { period: '2026-01', count: 2 },
      { period: '2026-02', count: 1 },
    ]);
  });

  it('groups by day', async () => {
    mockQuery([
      { id: '1', created_at: '2026-01-15T10:00:00Z' },
      { id: '2', created_at: '2026-01-15T14:00:00Z' },
    ]);

    const result = await getIncidentTrend('org1', dateRange, 'day');
    expect(result).toEqual([{ period: '2026-01-15', count: 2 }]);
  });

  it('returns sorted results', async () => {
    mockQuery([
      { id: '1', created_at: '2026-03-01T00:00:00Z' },
      { id: '2', created_at: '2026-01-01T00:00:00Z' },
    ]);

    const result = await getIncidentTrend('org1', dateRange, 'month');
    expect(result[0].period).toBe('2026-01');
    expect(result[1].period).toBe('2026-03');
  });
});

describe('getMTTR', () => {
  it('returns empty object when no resolved incidents', async () => {
    mockQuery(null);
    const result = await getMTTR('org1', dateRange);
    expect(result).toEqual({});
  });

  it('calculates MTTR by severity', async () => {
    mockQuery([
      {
        severity: 'high',
        created_at: '2026-01-01T00:00:00Z',
        resolved_at: '2026-01-01T10:00:00Z',
      },
      {
        severity: 'high',
        created_at: '2026-01-05T00:00:00Z',
        resolved_at: '2026-01-05T14:00:00Z',
      },
      {
        severity: 'low',
        created_at: '2026-01-10T00:00:00Z',
        resolved_at: '2026-01-10T02:00:00Z',
      },
    ]);

    const result = await getMTTR('org1', dateRange);
    expect(result.high).toBe(12); // (10 + 14) / 2 = 12
    expect(result.low).toBe(2);
  });
});
