/** @jest-environment node */

/**
 * Tests for lib/billing/subscriptions.ts — ensureSubscription
 *
 * Covers:
 * - Default plan fallback when null/invalid plan provided
 * - Existing active/trialing subscription short-circuit
 * - New subscription creation with trial for basic/pro
 * - Enterprise subscription creation (no trial)
 * - Legacy column fallback (org_id, plan_code missing)
 * - Entitlement sync on all paths
 */

// ---- Mocks ----

const dbCalls = {
  selects: [] as Array<{ table: string; filters: Record<string, unknown> }>,
  upserts: [] as Array<{ table: string; data: unknown }>,
};

let selectOverrides: Record<string, { data: unknown; error: unknown }> = {};
let upsertOverrides: Record<string, { error: { message: string } | null }> = {};

function resetDb() {
  dbCalls.selects = [];
  dbCalls.upserts = [];
  selectOverrides = {};
  upsertOverrides = {};
}

function mockAdminClient() {
  return {
    from: (table: string) => ({
      select: (_columns: string) => {
        const filterState: Record<string, unknown> = {};
        const chain = {
          eq: (col: string, val: unknown) => {
            filterState[col] = val;
            return chain;
          },
          maybeSingle: () => {
            dbCalls.selects.push({ table, filters: { ...filterState } });
            const key = `${table}.select`;
            if (selectOverrides[key]) return selectOverrides[key];
            return { data: null, error: null };
          },
        };
        return chain;
      },
      upsert: (data: unknown, _opts?: unknown) => {
        dbCalls.upserts.push({ table, data });
        const key = `${table}.upsert`;
        if (upsertOverrides[key]) return upsertOverrides[key];
        return { error: null };
      },
    }),
  };
}

const mockSyncEntitlements = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockAdminClient(),
}));

jest.mock('@/lib/billing/entitlements', () => ({
  syncEntitlementsForPlan: (...args: unknown[]) => mockSyncEntitlements(...args),
}));

import { ensureSubscription } from '@/lib/billing/subscriptions';

beforeEach(() => {
  resetDb();
  mockSyncEntitlements.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ensureSubscription', () => {
  const ORG = 'org-test-123';

  describe('plan resolution', () => {
    it('defaults to basic when planKey is null', async () => {
      await ensureSubscription(ORG, null);

      const subUpsert = dbCalls.upserts.find(u => u.table === 'org_subscriptions');
      expect(subUpsert).toBeDefined();
      expect((subUpsert!.data as Record<string, unknown>).plan_key).toBe('basic');
    });

    it('defaults to basic when planKey is invalid', async () => {
      await ensureSubscription(ORG, 'nonexistent');

      const subUpsert = dbCalls.upserts.find(u => u.table === 'org_subscriptions');
      expect((subUpsert!.data as Record<string, unknown>).plan_key).toBe('basic');
    });

    it('uses the provided plan when valid', async () => {
      await ensureSubscription(ORG, 'pro');

      const subUpsert = dbCalls.upserts.find(u => u.table === 'org_subscriptions');
      expect((subUpsert!.data as Record<string, unknown>).plan_key).toBe('pro');
    });
  });

  describe('existing subscription short-circuit', () => {
    it('skips upsert when an active subscription exists', async () => {
      selectOverrides['org_subscriptions.select'] = {
        data: { status: 'active', plan_key: 'pro' },
        error: null,
      };

      await ensureSubscription(ORG, 'pro');

      // Should NOT upsert org_subscriptions
      const subUpserts = dbCalls.upserts.filter(u => u.table === 'org_subscriptions');
      expect(subUpserts).toHaveLength(0);

      // Should still sync entitlements
      expect(mockSyncEntitlements).toHaveBeenCalledWith(ORG, 'pro');
    });

    it('skips upsert when a trialing subscription exists', async () => {
      selectOverrides['org_subscriptions.select'] = {
        data: { status: 'trialing', plan_key: 'basic' },
        error: null,
      };

      await ensureSubscription(ORG, 'basic');

      const subUpserts = dbCalls.upserts.filter(u => u.table === 'org_subscriptions');
      expect(subUpserts).toHaveLength(0);
      expect(mockSyncEntitlements).toHaveBeenCalledWith(ORG, 'basic');
    });

    it('creates subscription when existing status is canceled', async () => {
      selectOverrides['org_subscriptions.select'] = {
        data: { status: 'canceled', plan_key: 'pro' },
        error: null,
      };

      await ensureSubscription(ORG, 'pro');

      const subUpserts = dbCalls.upserts.filter(u => u.table === 'org_subscriptions');
      expect(subUpserts.length).toBeGreaterThan(0);
    });
  });

  describe('trial logic', () => {
    it('sets trialing status for basic plan', async () => {
      await ensureSubscription(ORG, 'basic');

      const subUpsert = dbCalls.upserts.find(u => u.table === 'org_subscriptions');
      const data = subUpsert!.data as Record<string, unknown>;
      expect(data.status).toBe('trialing');
      expect(data.trial_started_at).toBeTruthy();
      expect(data.trial_expires_at).toBeTruthy();
    });

    it('sets trialing status for pro plan', async () => {
      await ensureSubscription(ORG, 'pro');

      const subUpsert = dbCalls.upserts.find(u => u.table === 'org_subscriptions');
      const data = subUpsert!.data as Record<string, unknown>;
      expect(data.status).toBe('trialing');
    });

    it('sets active status for enterprise plan (no trial)', async () => {
      await ensureSubscription(ORG, 'enterprise');

      const subUpsert = dbCalls.upserts.find(u => u.table === 'org_subscriptions');
      const data = subUpsert!.data as Record<string, unknown>;
      expect(data.status).toBe('active');
      expect(data.trial_started_at).toBeNull();
      expect(data.trial_expires_at).toBeNull();
    });
  });

  describe('legacy column handling', () => {
    it('maps basic -> starter for legacy plan_code', async () => {
      await ensureSubscription(ORG, 'basic');

      const subUpsert = dbCalls.upserts.find(u => u.table === 'org_subscriptions');
      const data = subUpsert!.data as Record<string, unknown>;
      expect(data.plan_code).toBe('starter');
      expect(data.org_id).toBe(ORG);
    });

    it('keeps pro as pro for legacy plan_code', async () => {
      await ensureSubscription(ORG, 'pro');

      const subUpsert = dbCalls.upserts.find(u => u.table === 'org_subscriptions');
      const data = subUpsert!.data as Record<string, unknown>;
      expect(data.plan_code).toBe('pro');
    });

    it('falls back to base payload when legacy columns do not exist', async () => {
      upsertOverrides['org_subscriptions.upsert'] = {
        error: { message: 'column "org_id" does not exist' },
      };

      await ensureSubscription(ORG, 'basic');

      // Should have attempted upsert twice (legacy then fallback)
      const subUpserts = dbCalls.upserts.filter(u => u.table === 'org_subscriptions');
      expect(subUpserts.length).toBe(2);

      // Fallback should NOT have org_id or plan_code
      const fallback = subUpserts[1].data as Record<string, unknown>;
      expect(fallback).not.toHaveProperty('org_id');
      expect(fallback).not.toHaveProperty('plan_code');
    });
  });

  describe('entitlement sync', () => {
    it('syncs entitlements after creating a new subscription', async () => {
      await ensureSubscription(ORG, 'pro');

      expect(mockSyncEntitlements).toHaveBeenCalledWith(ORG, 'pro');
    });

    it('syncs entitlements even for existing subscriptions', async () => {
      selectOverrides['org_subscriptions.select'] = {
        data: { status: 'active', plan_key: 'enterprise' },
        error: null,
      };

      await ensureSubscription(ORG, 'enterprise');

      expect(mockSyncEntitlements).toHaveBeenCalledWith(ORG, 'enterprise');
    });
  });

  describe('legacy org backfill', () => {
    it('upserts into orgs table when organization exists', async () => {
      // First select is org_subscriptions (no existing), second is organizations
      selectOverrides['org_subscriptions.select'] = { data: null, error: null };

      // Override organizations lookup
      selectOverrides['organizations.select'] = {
        data: { name: 'Test Org', created_by: 'user-1' },
        error: null,
      };

      await ensureSubscription(ORG, 'basic');

      const orgsUpsert = dbCalls.upserts.find(u => u.table === 'orgs');
      expect(orgsUpsert).toBeDefined();
      expect((orgsUpsert!.data as Record<string, unknown>).name).toBe('Test Org');
    });
  });
});
