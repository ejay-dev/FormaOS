jest.mock('fs/promises', () => ({
  readdir: jest.fn().mockResolvedValue(['001_initial.sql', '002_rls.sql']),
  readFile: jest
    .fn()
    .mockResolvedValue('CREATE POLICY org_members_policy ON org_members'),
}));

jest.mock('@/lib/identity/audit', () => ({
  logIdentityEvent: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => {
  const query: Record<string, jest.Mock> = {};
  query.from = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.insert = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.neq = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.limit = jest.fn(() => query);
  query.then = jest.fn((r: Function) => r({ data: [], error: null, count: 0 }));
  return { createSupabaseAdminClient: () => query, __query: query };
});

import {
  verifyIsolation,
  generateIsolationReport,
} from '@/lib/data-governance/isolation-verifier';

function q() {
  return require('@/lib/supabase/admin').__query;
}

beforeEach(() => {
  const query = q();
  query.from.mockImplementation(() => query);
  query.select.mockImplementation(() => query);
  query.insert.mockImplementation(() => Promise.resolve({ error: null }));
  query.eq.mockImplementation(() => query);
  query.neq.mockImplementation(() => query);
  query.order.mockImplementation(() => query);
  query.limit.mockImplementation(() => query);
  query.then.mockImplementation((r: Function) =>
    r({ data: [], error: null, count: 0 }),
  );
});

describe('verifyIsolation', () => {
  it('returns checks for all tenant tables', async () => {
    const result = await verifyIsolation('org-1');
    expect(result.checks.length).toBeGreaterThanOrEqual(9);
    expect(result.summary).toHaveProperty('passed');
    expect(result.summary).toHaveProperty('warnings');
  });

  it('marks tables with migration evidence as pass', async () => {
    const result = await verifyIsolation('org-1');
    const orgMembersCheck = result.checks.find(
      (c) => c.table === 'org_members',
    );
    expect(orgMembersCheck).toBeDefined();
    expect(orgMembersCheck!.hasOrgColumn).toBe(true);
    expect(orgMembersCheck!.migrationEvidence).toBe(true);
    expect(orgMembersCheck!.status).toBe('pass');
  });

  it('inserts verification results', async () => {
    await verifyIsolation('org-1');
    expect(q().insert).toHaveBeenCalled();
  });

  it('logs identity audit event', async () => {
    const { logIdentityEvent } = require('@/lib/identity/audit');
    await verifyIsolation('org-1');
    expect(logIdentityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'governance.isolation.verified' }),
    );
  });
});

describe('generateIsolationReport', () => {
  it('returns report with results', async () => {
    q().then.mockImplementation((r: Function) =>
      r({
        data: [{ id: '1', checks: [], summary: { passed: 9, warnings: 0 } }],
        error: null,
      }),
    );
    const report = await generateIsolationReport('org-1');
    expect(report.generatedAt).toBeDefined();
    expect(report.results).toHaveLength(1);
  });

  it('throws on error', async () => {
    q().then.mockImplementation((r: Function) =>
      r({ data: null, error: { message: 'db err' } }),
    );
    await expect(generateIsolationReport('org-1')).rejects.toThrow('db err');
  });
});
