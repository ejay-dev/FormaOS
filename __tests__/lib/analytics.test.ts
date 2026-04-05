/** @jest-environment node */
jest.mock('server-only', () => ({}));

// Builder pattern — function declaration hoisted above jest.mock
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
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/server', () => {
  const c = {
    from: jest.fn(() => createBuilder()),
    auth: { getSession: jest.fn() },
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

function getClient() {
  return require('@/lib/supabase/server').__client;
}

import {
  getComplianceMetrics,
  getTeamMetrics,
  getComplianceTrend,
  calculateRiskScore,
  exportAnalytics,
} from '@/lib/analytics';

beforeEach(() => jest.clearAllMocks());

describe('getComplianceMetrics', () => {
  it('returns metrics from certificates and tasks', async () => {
    const now = new Date();
    const future = new Date(
      now.getTime() + 10 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const past = new Date(
      now.getTime() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString();

    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        // certificates
        return createBuilder({
          data: [
            { id: '1', expiry_date: future, status: 'active' },
            { id: '2', expiry_date: past, status: 'expired' },
          ],
          error: null,
        });
      }
      // tasks
      return createBuilder({
        data: [
          {
            created_at: '2024-01-01T00:00:00Z',
            completed_at: '2024-01-05T00:00:00Z',
          },
        ],
        error: null,
      });
    });

    const result = await getComplianceMetrics('org-1');
    expect(result.totalCertificates).toBe(2);
    expect(result.activeCertificates).toBe(1);
    expect(result.expiredCertificates).toBe(1);
    expect(typeof result.completionRate).toBe('number');
    expect(typeof result.averageCompletionTime).toBe('number');
  });

  it('handles empty data', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await getComplianceMetrics('org-1');
    expect(result.totalCertificates).toBe(0);
    expect(result.completionRate).toBe(0);
  });
});

describe('getTeamMetrics', () => {
  it('returns member and task metrics', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        // org_members
        return createBuilder({
          data: [
            {
              id: '1',
              email: 'a@b.com',
              role: 'admin',
              last_active: new Date().toISOString(),
            },
            {
              id: '2',
              email: 'c@d.com',
              role: 'member',
              last_active: '2020-01-01T00:00:00Z',
            },
          ],
          error: null,
        });
      }
      // tasks
      return createBuilder({
        data: [
          { assigned_to: 'a@b.com', status: 'completed' },
          { assigned_to: 'a@b.com', status: 'pending' },
          { assigned_to: 'c@d.com', status: 'completed' },
        ],
        error: null,
      });
    });

    const result = await getTeamMetrics('org-1');
    expect(result.totalMembers).toBe(2);
    expect(result.activeMembers).toBe(1);
    expect(result.membersByRole).toEqual({ admin: 1, member: 1 });
    expect(result.averageTasksPerMember).toBe(2);
    expect(result.topPerformers.length).toBeGreaterThan(0);
  });

  it('handles no members', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await getTeamMetrics('org-1');
    expect(result.totalMembers).toBe(0);
    expect(result.topPerformers).toEqual([]);
  });
});

describe('getComplianceTrend', () => {
  it('returns 31 days of trend data', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          { completed_at: new Date().toISOString() },
          { completed_at: new Date().toISOString() },
        ],
        error: null,
      }),
    );
    const trend = await getComplianceTrend('org-1');
    expect(trend.length).toBe(31);
    expect(trend[0]).toHaveProperty('date');
    expect(trend[0]).toHaveProperty('value');
  });
});

describe('calculateRiskScore', () => {
  it('calculates risk from expired certs, overdue tasks, inactive members', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1)
        return createBuilder({ data: [{ id: '1' }], error: null }); // expired certs
      if (callIdx === 2)
        return createBuilder({ data: [{ id: '1' }, { id: '2' }], error: null }); // overdue tasks
      return createBuilder({
        data: [
          { id: '1', last_active: '2020-01-01T00:00:00Z' },
          { id: '2', last_active: new Date().toISOString() },
        ],
        error: null,
      });
    });

    const result = await calculateRiskScore('org-1');
    expect(result.overall).toBeGreaterThan(0);
    expect(result.factors.length).toBe(3);
    expect(result.factors[0].name).toBe('Expired Certificates');
  });
});

describe('exportAnalytics', () => {
  it('returns CSV string', async () => {
    // Mock all DB calls (8+ from all sub-functions)
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const csv = await exportAnalytics('org-1');
    expect(csv).toContain('Metric,Value');
    expect(csv).toContain('Total Certificates');
    expect(csv).toContain('Date,Completed Tasks');
  });
});
