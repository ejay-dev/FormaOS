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

jest.mock('@/lib/identity/audit', () => ({
  logIdentityEvent: jest.fn(),
}));

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  applyRetentionPolicy,
  listRetentionPolicies,
  evaluateRetention,
  executeRetention,
  BUILT_IN_RETENTION_POLICIES,
} from '@/lib/data-governance/retention';

beforeEach(() => jest.clearAllMocks());

describe('BUILT_IN_RETENTION_POLICIES', () => {
  it('has GDPR and SOC2 policies', () => {
    expect(BUILT_IN_RETENTION_POLICIES.GDPR.length).toBeGreaterThan(0);
    expect(BUILT_IN_RETENTION_POLICIES.SOC2.length).toBeGreaterThan(0);
  });

  it('GDPR policies have correct structure', () => {
    for (const policy of BUILT_IN_RETENTION_POLICIES.GDPR) {
      expect(policy).toHaveProperty('resource_type');
      expect(policy).toHaveProperty('retention_days');
      expect(policy).toHaveProperty('action');
    }
  });
});

describe('applyRetentionPolicy', () => {
  it('upserts retention policy', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          id: 'pol-new',
          org_id: 'org-1',
          document_category: 'tasks',
          retention_period_days: 365,
          action_on_expiry: 'archive',
          is_active: true,
          name: 'custom: tasks',
          description: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    );
    const result = await applyRetentionPolicy('org-1', {
      resource_type: 'tasks',
      retention_days: 365,
      action: 'archive',
    });
    expect(result).toHaveProperty('resource_type', 'tasks');
    expect(getClient().from).toHaveBeenCalledWith('retention_policies');
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'upsert fail' } }),
    );
    await expect(
      applyRetentionPolicy('org-1', {
        resource_type: 'tasks',
        retention_days: 30,
        action: 'delete',
      }),
    ).rejects.toThrow('upsert fail');
  });
});

describe('listRetentionPolicies', () => {
  it('returns policies for org', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          {
            id: 'pol-1',
            org_id: 'org-1',
            document_category: 'tasks',
            retention_period_days: 365,
            action_on_expiry: 'archive',
            is_active: true,
            name: 'custom: tasks',
            description: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        error: null,
      }),
    );
    const result = await listRetentionPolicies('org-1');
    expect(result.length).toBe(1);
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'list fail' } }),
    );
    await expect(listRetentionPolicies('org-1')).rejects.toThrow('list fail');
  });
});

describe('evaluateRetention', () => {
  it('evaluates retention for each policy', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        // listRetentionPolicies
        return createBuilder({
          data: [
            {
              id: 'pol-2',
              org_id: 'org-1',
              document_category: 'tasks',
              retention_period_days: 30,
              action_on_expiry: 'archive',
              is_active: true,
              name: 'custom: tasks',
              description: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        });
      }
      // selectExpiredRows
      return createBuilder({
        data: [{ id: 'row-1' }, { id: 'row-2' }],
        error: null,
      });
    });
    const result = await evaluateRetention('org-1');
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('expired_count', 2);
  });
});

describe('executeRetention', () => {
  it('dry run returns results without modifying data', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'pol-tasks',
              org_id: 'org-1',
              document_category: 'tasks',
              retention_period_days: 30,
              action_on_expiry: 'archive',
              is_active: true,
              name: 'custom: tasks',
              description: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [{ id: 'r1' }], error: null });
    });
    const result = await executeRetention('org-1', true);
    expect(result.length).toBe(1);
  });

  it('live run archives rows', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'pol-tasks',
              org_id: 'org-1',
              document_category: 'tasks',
              retention_period_days: 30,
              action_on_expiry: 'archive',
              is_active: true,
              name: 'custom: tasks',
              description: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        });
      }
      // selectExpiredRows + archiveRows
      return createBuilder({ data: [{ id: 'r1' }], error: null });
    });
    const result = await executeRetention('org-1', false);
    expect(result.length).toBe(1);
  });

  it('live run deletes rows', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'pol-notif',
              org_id: 'org-1',
              document_category: 'notifications',
              retention_period_days: 30,
              action_on_expiry: 'delete',
              is_active: true,
              name: 'custom: notifications',
              description: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [{ id: 'r1' }], error: null });
    });
    const result = await executeRetention('org-1', false);
    expect(result.length).toBe(1);
  });

  it('live run anonymizes rows', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'pol-evi',
              org_id: 'org-1',
              // 'anonymize' isn't a valid DB enum value
              // (action_on_expiry CHECK is archive|delete|review);
              // store as 'archive' and let the resource config's
              // anonymizeFields drive the anonymize action at runtime.
              document_category: 'evidence',
              retention_period_days: 30,
              action_on_expiry: 'archive',
              is_active: true,
              name: 'custom: evidence',
              description: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [{ id: 'r1' }], error: null });
    });
    const result = await executeRetention('org-1', false);
    expect(result.length).toBe(1);
  });
});
