/**
 * Tests for lib/admin/metrics-service.ts — pure function isSyntheticOrgName
 */

jest.mock('server-only', () => ({}));

jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
}));

function createBuilder(result: any = { data: null, error: null, count: 0 }) {
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

const __admin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => __admin),
}));

jest.mock('@/lib/supabase/schema-compat', () => ({
  isMissingSupabaseColumnError: jest.fn(() => false),
}));

import { getAdminOverviewMetrics } from '@/lib/admin/metrics-service';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAdminOverviewMetrics', () => {
  it('returns metrics with empty data', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: 0 }),
    );

    const result = await getAdminOverviewMetrics();

    expect(result).toHaveProperty('totalOrgs');
    expect(result).toHaveProperty('activeByPlan');
    expect(result).toHaveProperty('trialsActive');
    expect(result).toHaveProperty('mrrCents');
    expect(result).toHaveProperty('failedPayments');
    expect(result).toHaveProperty('orgsByDay');
    expect(result.totalOrgs).toBe(0);
  });

  it('filters out synthetic orgs', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: '1',
            name: 'Real Org',
            created_at: new Date().toISOString(),
            onboarding_completed: true,
            lifecycle_status: null,
          },
          {
            id: '2',
            name: 'E2E Test Corp',
            created_at: new Date().toISOString(),
            onboarding_completed: false,
            lifecycle_status: null,
          },
          {
            id: '3',
            name: 'e2e test org something',
            created_at: new Date().toISOString(),
            onboarding_completed: true,
            lifecycle_status: null,
          },
          {
            id: '4',
            name: 'QA Smoke Company',
            created_at: new Date().toISOString(),
            onboarding_completed: true,
            lifecycle_status: null,
          },
          {
            id: '5',
            name: 'test@test.formaos.local',
            created_at: new Date().toISOString(),
            onboarding_completed: true,
            lifecycle_status: null,
          },
        ],
        error: null,
        count: 0,
      }),
    );

    const result = await getAdminOverviewMetrics();
    // Only 'Real Org' should remain (id: 1)
    expect(result.totalOrgs).toBe(1);
    expect(result.excludedSyntheticOrgs).toBe(4);
  });

  it('counts active subscriptions by plan', async () => {
    let callIdx = 0;
    __admin.from = jest.fn(() => {
      callIdx++;
      if (callIdx === 1) {
        // organizations
        return createBuilder({
          data: [
            {
              id: 'org-1',
              name: 'Org 1',
              created_at: new Date().toISOString(),
              onboarding_completed: true,
              lifecycle_status: null,
            },
          ],
          error: null,
        });
      }
      if (callIdx === 2) {
        // subscriptions
        return createBuilder({
          data: [
            {
              organization_id: 'org-1',
              status: 'active',
              plan_key: 'pro',
              current_period_end: null,
              trial_expires_at: null,
              payment_failures: 0,
            },
          ],
          error: null,
        });
      }
      if (callIdx === 3) {
        // plans
        return createBuilder({
          data: [
            { key: 'pro', price_cents: 4900 },
            { key: 'basic', price_cents: 1900 },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await getAdminOverviewMetrics();
    expect(result.activeByPlan.pro).toBe(1);
    expect(result.mrrCents).toBe(4900);
  });

  it('counts trialing subscriptions', async () => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 3);

    let callIdx = 0;
    __admin.from = jest.fn(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'org-1',
              name: 'Trial Org',
              created_at: new Date().toISOString(),
              onboarding_completed: false,
              lifecycle_status: null,
            },
          ],
          error: null,
        });
      }
      if (callIdx === 2) {
        return createBuilder({
          data: [
            {
              organization_id: 'org-1',
              status: 'trialing',
              plan_key: 'pro',
              current_period_end: sevenDaysFromNow.toISOString(),
              trial_expires_at: sevenDaysFromNow.toISOString(),
              payment_failures: 0,
            },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await getAdminOverviewMetrics();
    expect(result.trialsActive).toBe(1);
    expect(result.trialsExpiring).toBe(1);
  });

  it('counts failed payments', async () => {
    let callIdx = 0;
    __admin.from = jest.fn(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'org-1',
              name: 'Org',
              created_at: new Date().toISOString(),
              onboarding_completed: true,
              lifecycle_status: null,
            },
          ],
          error: null,
        });
      }
      if (callIdx === 2) {
        return createBuilder({
          data: [
            {
              organization_id: 'org-1',
              status: 'past_due',
              plan_key: 'pro',
              current_period_end: null,
              trial_expires_at: null,
              payment_failures: 2,
            },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await getAdminOverviewMetrics();
    expect(result.failedPayments).toBe(1);
  });

  it('counts suspended orgs', async () => {
    let callIdx = 0;
    __admin.from = jest.fn(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'org-1',
              name: 'Suspended',
              created_at: new Date().toISOString(),
              onboarding_completed: true,
              lifecycle_status: 'suspended',
            },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await getAdminOverviewMetrics();
    expect(result.suspendedOrgs).toBe(1);
  });

  it('counts activation at risk orgs', async () => {
    let callIdx = 0;
    __admin.from = jest.fn(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'org-1',
              name: 'Risky',
              created_at: new Date().toISOString(),
              onboarding_completed: false,
              lifecycle_status: null,
            },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await getAdminOverviewMetrics();
    expect(result.activationAtRisk).toBeGreaterThanOrEqual(1);
  });

  it('returns 7-day orgsByDay array', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: 0 }),
    );

    const result = await getAdminOverviewMetrics();
    expect(result.orgsByDay).toHaveLength(7);
    expect(result.orgsByDay[0]).toHaveProperty('date');
    expect(result.orgsByDay[0]).toHaveProperty('count');
  });

  it('handles subscription with payment_failures count > 0', async () => {
    let callIdx = 0;
    __admin.from = jest.fn(() => {
      callIdx++;
      if (callIdx === 1) {
        return createBuilder({
          data: [
            {
              id: 'org-1',
              name: 'Org',
              created_at: new Date().toISOString(),
              onboarding_completed: true,
              lifecycle_status: null,
            },
          ],
          error: null,
        });
      }
      if (callIdx === 2) {
        return createBuilder({
          data: [
            {
              organization_id: 'org-1',
              status: 'active',
              plan_key: 'pro',
              current_period_end: null,
              trial_expires_at: null,
              payment_failures: 1,
            },
          ],
          error: null,
        });
      }
      return createBuilder({ data: [], error: null, count: 0 });
    });

    const result = await getAdminOverviewMetrics();
    expect(result.failedPayments).toBe(1);
  });
});
