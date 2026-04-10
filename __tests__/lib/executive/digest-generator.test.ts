/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import { generateExecutiveDigest } from '@/lib/executive/digest-generator';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function mockDb() {
  const chains: Record<string, any> = {};

  const makeChain = (data: unknown, count?: number) => {
    const result =
      count !== undefined
        ? { data: null, count, error: null }
        : { data, error: null };
    const c: Record<string, any> = {};
    c.select = jest.fn().mockReturnValue(c);
    c.eq = jest.fn().mockReturnValue(c);
    c.neq = jest.fn().mockReturnValue(c);
    c.in = jest.fn().mockReturnValue(c);
    c.lt = jest.fn().mockReturnValue(c);
    c.gte = jest.fn().mockReturnValue(c);
    c.lte = jest.fn().mockReturnValue(c);
    c.order = jest.fn().mockReturnValue(c);
    c.limit = jest.fn().mockReturnValue(c);
    c.single = jest.fn().mockResolvedValue(result);
    c.maybeSingle = jest.fn().mockResolvedValue(result);
    // Make chain thenable so `await chain.eq(...)` resolves
    c.then = (resolve: (v: any) => void, reject?: (e: any) => void) =>
      Promise.resolve(result).then(resolve, reject);
    return c;
  };

  // organizations -> single
  chains.organizations = makeChain({ name: 'TestOrg' });
  // org_controls -> select for compliance score
  chains.org_controls = makeChain([
    { status: 'satisfied' },
    { status: 'satisfied' },
    { status: 'failed' },
    { status: 'pending' },
  ]);
  // org_tasks overdue count
  chains.org_tasks_overdue = makeChain(null, 6);
  // incidents current period
  chains.org_incidents_current = makeChain(null, 3);
  // incidents previous period
  chains.org_incidents_prev = makeChain(null, 1);
  // risk controls
  chains.org_controls_risk = makeChain([
    { title: 'Firewall', priority: 'critical' },
  ]);
  // deadline tasks
  chains.org_tasks_deadline = makeChain([
    { title: 'Review policy', due_date: '2026-01-20' },
  ]);
  // recently satisfied
  chains.org_controls_wins = makeChain([{ title: 'Encryption Setup' }]);

  let controlsCallCount = 0;
  let tasksCallCount = 0;
  let incidentsCallCount = 0;

  const db = {
    from: jest.fn((table: string) => {
      if (table === 'organizations') return chains.organizations;
      if (table === 'org_controls') {
        controlsCallCount++;
        if (controlsCallCount === 1) return chains.org_controls;
        if (controlsCallCount === 2) return chains.org_controls_risk;
        return chains.org_controls_wins;
      }
      if (table === 'org_tasks') {
        tasksCallCount++;
        if (tasksCallCount === 1) return chains.org_tasks_overdue;
        return chains.org_tasks_deadline;
      }
      if (table === 'org_incidents') {
        incidentsCallCount++;
        if (incidentsCallCount === 1) return chains.org_incidents_current;
        return chains.org_incidents_prev;
      }
      return makeChain(null);
    }),
  };

  return db;
}

describe('lib/executive/digest-generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates weekly digest with correct metrics', async () => {
    const db = mockDb();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

    const result = await generateExecutiveDigest('org1', 'weekly');

    expect(result.orgName).toBe('TestOrg');
    expect(result.period).toBe('weekly');
    expect(result.periodLabel).toContain('Week of');
    expect(result.metrics.complianceScore).toBe(50); // 2 of 4 satisfied
    expect(result.topRisks).toHaveLength(1);
    expect(result.topRisks[0].title).toBe('Firewall');
    expect(result.upcomingDeadlines).toHaveLength(1);
    expect(result.topWins).toHaveLength(1);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('generates monthly digest', async () => {
    const db = mockDb();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

    const result = await generateExecutiveDigest('org2', 'monthly');

    expect(result.period).toBe('monthly');
    expect(result.periodLabel).toContain('Month of');
  });

  it('handles missing org name', async () => {
    const db = mockDb();
    // Override organizations to return null
    const nullChain: Record<string, any> = {};
    nullChain.select = jest.fn().mockReturnValue(nullChain);
    nullChain.eq = jest.fn().mockReturnValue(nullChain);
    nullChain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    nullChain.then = (resolve: (v: any) => void, reject?: (e: any) => void) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject);
    db.from = jest.fn((table: string) => {
      if (table === 'organizations') return nullChain;
      // Minimal mocks for other tables
      const c: Record<string, any> = {};
      const result = { data: null, error: null };
      c.select = jest.fn().mockReturnValue(c);
      c.eq = jest.fn().mockReturnValue(c);
      c.neq = jest.fn().mockReturnValue(c);
      c.in = jest.fn().mockReturnValue(c);
      c.lt = jest.fn().mockReturnValue(c);
      c.gte = jest.fn().mockReturnValue(c);
      c.lte = jest.fn().mockReturnValue(c);
      c.order = jest.fn().mockReturnValue(c);
      c.limit = jest.fn().mockReturnValue(c);
      c.single = jest.fn().mockResolvedValue(result);
      c.then = (resolve: (v: any) => void, reject?: (e: any) => void) =>
        Promise.resolve(result).then(resolve, reject);
      return c;
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

    const result = await generateExecutiveDigest('orgX', 'weekly');
    expect(result.orgName).toBe('Organization');
  });

  it('returns zero compliance score when no controls', async () => {
    const db = mockDb();
    let calls = 0;
    const origFrom = db.from;
    db.from = jest.fn((table: string) => {
      if (table === 'org_controls') {
        calls++;
        if (calls === 1) {
          // Return empty controls array
          const emptyResult = { data: [], error: null };
          const c: Record<string, any> = {};
          c.select = jest.fn().mockReturnValue(c);
          c.eq = jest.fn().mockReturnValue(c);
          c.neq = jest.fn().mockReturnValue(c);
          c.in = jest.fn().mockReturnValue(c);
          c.gte = jest.fn().mockReturnValue(c);
          c.limit = jest.fn().mockReturnValue(c);
          c.single = jest.fn().mockResolvedValue(emptyResult);
          c.then = (resolve: (v: any) => void, reject?: (e: any) => void) =>
            Promise.resolve(emptyResult).then(resolve, reject);
          return c;
        }
      }
      return origFrom(table);
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

    const result = await generateExecutiveDigest('orgY', 'weekly');
    expect(result.metrics.complianceScore).toBe(0);
  });

  it('adds recommendation when compliance below 70', async () => {
    const db = mockDb();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

    const result = await generateExecutiveDigest('org1', 'weekly');
    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Compliance score below target'),
      ]),
    );
  });

  it('adds overdue task recommendation when >5', async () => {
    const db = mockDb();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

    const result = await generateExecutiveDigest('org1', 'weekly');
    expect(result.recommendations).toEqual(
      expect.arrayContaining([expect.stringContaining('overdue tasks')]),
    );
  });
});
