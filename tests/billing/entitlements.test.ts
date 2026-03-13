/** @jest-environment node */

/**
 * Tests for lib/billing/entitlements.ts
 *
 * Covers:
 * - syncEntitlementsForPlan: correct records per plan
 * - requireActiveSubscription: status validation, trial expiry
 * - requireEntitlement: feature gate checks
 * - getEntitlementLimit: limit value retrieval
 */

// ---- Mocks ----

const dbCalls = {
  selects: [] as Array<{ table: string; columns: string; filters: Record<string, unknown> }>,
  upserts: [] as Array<{ table: string; data: unknown; opts: unknown }>,
};

let selectResults: Record<string, { data: unknown; error: unknown }> = {};

function resetDb() {
  dbCalls.selects = [];
  dbCalls.upserts = [];
  selectResults = {};
}

function createMockClient() {
  return {
    from: (table: string) => ({
      select: (columns: string) => {
        const filters: Record<string, unknown> = {};
        const chain = {
          eq: (col: string, val: unknown) => {
            filters[col] = val;
            return chain;
          },
          in: (col: string, vals: unknown[]) => {
            filters[col] = vals;
            return chain;
          },
          maybeSingle: () => {
            dbCalls.selects.push({ table, columns, filters: { ...filters } });
            const key = Object.keys(filters).sort().join(',');
            const resultKey = `${table}:${key}`;
            // Check specific overrides first, then table-level
            if (selectResults[resultKey]) return selectResults[resultKey];
            if (selectResults[table]) return selectResults[table];
            return { data: null, error: null };
          },
        };
        return chain;
      },
      upsert: (data: unknown, opts?: unknown) => {
        dbCalls.upserts.push({ table, data, opts });
        return { error: null };
      },
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
  };
}

const mockAdminClient = createMockClient();
const mockServerClient = createMockClient();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockAdminClient,
}));

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => Promise.resolve(mockServerClient),
}));

import {
  syncEntitlementsForPlan,
  requireActiveSubscription,
  requireEntitlement,
  getEntitlementLimit,
} from '@/lib/billing/entitlements';

beforeEach(() => {
  resetDb();
});

describe('syncEntitlementsForPlan', () => {
  it('upserts correct entitlements for basic plan', async () => {
    await syncEntitlementsForPlan('org-1', 'basic');

    const upsert = dbCalls.upserts.find(u => u.table === 'org_entitlements');
    expect(upsert).toBeDefined();

    const records = upsert!.data as Array<{ feature_key: string; enabled: boolean; limit_value: unknown }>;
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feature_key: 'audit_export', enabled: true }),
        expect.objectContaining({ feature_key: 'reports', enabled: true }),
        expect.objectContaining({ feature_key: 'framework_evaluations', enabled: true }),
        expect.objectContaining({ feature_key: 'team_limit', enabled: true, limit_value: 15 }),
      ]),
    );
  });

  it('upserts correct entitlements for pro plan', async () => {
    await syncEntitlementsForPlan('org-1', 'pro');

    const upsert = dbCalls.upserts.find(u => u.table === 'org_entitlements');
    const records = upsert!.data as Array<{ feature_key: string; limit_value: unknown }>;

    // Pro includes certifications
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feature_key: 'certifications', enabled: true }),
      ]),
    );

    // Team limit is 75
    const teamLimit = records.find(r => r.feature_key === 'team_limit');
    expect(teamLimit?.limit_value).toBe(75);
  });

  it('upserts unlimited team_limit (null) for enterprise', async () => {
    await syncEntitlementsForPlan('org-1', 'enterprise');

    const upsert = dbCalls.upserts.find(u => u.table === 'org_entitlements');
    const records = upsert!.data as Array<{ feature_key: string; limit_value: unknown }>;

    const teamLimit = records.find(r => r.feature_key === 'team_limit');
    expect(teamLimit?.limit_value).toBeNull();
  });

  it('sets organization_id on all records', async () => {
    await syncEntitlementsForPlan('org-xyz', 'basic');

    const upsert = dbCalls.upserts.find(u => u.table === 'org_entitlements');
    const records = upsert!.data as Array<{ organization_id: string }>;
    for (const r of records) {
      expect(r.organization_id).toBe('org-xyz');
    }
  });

  it('uses onConflict for upsert', async () => {
    await syncEntitlementsForPlan('org-1', 'basic');

    const upsert = dbCalls.upserts.find(u => u.table === 'org_entitlements');
    expect(upsert!.opts).toEqual({
      onConflict: 'organization_id,feature_key',
    });
  });
});

describe('requireActiveSubscription', () => {
  it('throws when no subscription exists', async () => {
    selectResults['org_subscriptions'] = { data: null, error: null };

    await expect(requireActiveSubscription('org-1')).rejects.toThrow(
      'Subscription inactive',
    );
  });

  it('throws on DB error', async () => {
    selectResults['org_subscriptions'] = {
      data: null,
      error: { message: 'connection failed' },
    };

    await expect(requireActiveSubscription('org-1')).rejects.toThrow(
      'Subscription lookup failed',
    );
  });

  it('returns plan info for active subscription', async () => {
    selectResults['org_subscriptions'] = {
      data: { plan_key: 'pro', status: 'active', current_period_end: null, trial_expires_at: null },
      error: null,
    };

    const result = await requireActiveSubscription('org-1');
    expect(result).toEqual({ planKey: 'pro', status: 'active' });
  });

  it('returns plan info for valid trialing subscription', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    selectResults['org_subscriptions'] = {
      data: {
        plan_key: 'basic',
        status: 'trialing',
        current_period_end: futureDate,
        trial_expires_at: futureDate,
      },
      error: null,
    };

    const result = await requireActiveSubscription('org-1');
    expect(result).toEqual({ planKey: 'basic', status: 'trialing' });
  });

  it('throws when trial has expired', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    selectResults['org_subscriptions'] = {
      data: {
        plan_key: 'basic',
        status: 'trialing',
        current_period_end: pastDate,
        trial_expires_at: pastDate,
      },
      error: null,
    };

    await expect(requireActiveSubscription('org-1')).rejects.toThrow(
      'Trial expired',
    );
  });

  it('throws for canceled subscription', async () => {
    selectResults['org_subscriptions'] = {
      data: { plan_key: 'pro', status: 'canceled', current_period_end: null },
      error: null,
    };

    await expect(requireActiveSubscription('org-1')).rejects.toThrow(
      'Subscription inactive',
    );
  });

  it('throws when plan_key is invalid', async () => {
    selectResults['org_subscriptions'] = {
      data: { plan_key: 'invalid_plan', status: 'active', current_period_end: null },
      error: null,
    };

    await expect(requireActiveSubscription('org-1')).rejects.toThrow(
      'Subscription plan invalid',
    );
  });
});

describe('requireEntitlement', () => {
  beforeEach(() => {
    // Active subscription for all entitlement tests
    selectResults['org_subscriptions'] = {
      data: { plan_key: 'pro', status: 'active', current_period_end: null },
      error: null,
    };
  });

  it('passes when entitlement is enabled', async () => {
    selectResults['org_entitlements'] = {
      data: { enabled: true },
      error: null,
    };

    await expect(requireEntitlement('org-1', 'reports')).resolves.not.toThrow();
  });

  it('throws when entitlement is disabled', async () => {
    selectResults['org_entitlements'] = {
      data: { enabled: false },
      error: null,
    };

    await expect(requireEntitlement('org-1', 'certifications')).rejects.toThrow(
      'Entitlement blocked: certifications',
    );
  });

  it('throws when entitlement does not exist', async () => {
    selectResults['org_entitlements'] = { data: null, error: null };

    await expect(requireEntitlement('org-1', 'certifications')).rejects.toThrow(
      'Entitlement blocked: certifications',
    );
  });

  it('throws on DB error', async () => {
    selectResults['org_entitlements'] = {
      data: null,
      error: { message: 'timeout' },
    };

    await expect(requireEntitlement('org-1', 'reports')).rejects.toThrow(
      'Entitlement lookup failed',
    );
  });
});

describe('getEntitlementLimit', () => {
  beforeEach(() => {
    selectResults['org_subscriptions'] = {
      data: { plan_key: 'pro', status: 'active', current_period_end: null },
      error: null,
    };
  });

  it('returns limit_value when entitlement exists and is enabled', async () => {
    selectResults['org_entitlements'] = {
      data: { enabled: true, limit_value: 75 },
      error: null,
    };

    const limit = await getEntitlementLimit('org-1', 'team_limit');
    expect(limit).toBe(75);
  });

  it('returns null when limit_value is not set', async () => {
    selectResults['org_entitlements'] = {
      data: { enabled: true, limit_value: null },
      error: null,
    };

    const limit = await getEntitlementLimit('org-1', 'reports');
    expect(limit).toBeNull();
  });

  it('throws when entitlement is disabled', async () => {
    selectResults['org_entitlements'] = {
      data: { enabled: false, limit_value: 10 },
      error: null,
    };

    await expect(getEntitlementLimit('org-1', 'team_limit')).rejects.toThrow(
      'Entitlement blocked',
    );
  });
});
