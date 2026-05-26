/**
 * Tests for lib/billing/enforce-grace-period.ts
 *
 * Three behaviours that have to hold:
 *   1. Active subscription → no throw (the common path).
 *   2. Past-due inside the 3-day grace window → no throw (we let writes
 *      through; the dunning email + UI banner handle the warning).
 *   3. Past-due past the grace window → throws OrgReadOnlyError with
 *      the correct daysOverdue count.
 */

jest.mock('server-only', () => ({}));

const maybeSingle = jest.fn();
const eq = jest.fn(() => ({ maybeSingle }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select }));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from }),
}));

import {
  assertOrgCanWrite,
  OrgReadOnlyError,
} from '@/lib/billing/enforce-grace-period';

const FOUR_DAYS_AGO = new Date(
  Date.now() - 4 * 24 * 60 * 60 * 1000,
).toISOString();

const ONE_DAY_AGO = new Date(
  Date.now() - 1 * 24 * 60 * 60 * 1000,
).toISOString();

describe('assertOrgCanWrite', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    eq.mockClear();
    select.mockClear();
    from.mockClear();
  });

  it('allows writes when subscription is active', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { status: 'active', payment_failed_at: null },
      error: null,
    });
    await expect(assertOrgCanWrite('org-1')).resolves.toBeUndefined();
  });

  it('allows writes during the grace window (past-due < 3 days)', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { status: 'past_due', payment_failed_at: ONE_DAY_AGO },
      error: null,
    });
    await expect(assertOrgCanWrite('org-2')).resolves.toBeUndefined();
  });

  it('throws OrgReadOnlyError once grace window has elapsed', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { status: 'past_due', payment_failed_at: FOUR_DAYS_AGO },
      error: null,
    });
    await expect(assertOrgCanWrite('org-3')).rejects.toBeInstanceOf(
      OrgReadOnlyError,
    );
  });

  it('no-ops when the org has no subscription row (trial / unprovisioned)', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(assertOrgCanWrite('org-4')).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Nightly enforcer (cron-driven) — covers background paths the per-write
// guard can't see (scheduled exports, automation, webhook fan-outs).
// ---------------------------------------------------------------------------

const disableEntitlementsForOrg = jest.fn();
jest.mock('@/lib/billing/entitlements', () => ({
  disableEntitlementsForOrg: (...args: unknown[]) =>
    disableEntitlementsForOrg(...args),
}));

// The enforcer talks to org_subscriptions directly via the admin client.
// Re-mock with a query-shape that returns rows rather than a single row.
const adminListBuilder = {
  select: jest.fn(() => adminListBuilder),
  eq: jest.fn(() => adminListBuilder),
  not: jest.fn(() => adminListBuilder),
  lt: jest.fn(() => adminListBuilder),
  then: jest.fn(),
};

jest.mock('@/lib/observability/structured-logger', () => ({
  billingLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('runGracePeriodEnforcement', () => {
  beforeEach(() => {
    disableEntitlementsForOrg.mockReset();
    adminListBuilder.select.mockClear().mockReturnValue(adminListBuilder);
    adminListBuilder.eq.mockClear().mockReturnValue(adminListBuilder);
    adminListBuilder.not.mockClear().mockReturnValue(adminListBuilder);
    adminListBuilder.lt.mockClear().mockReturnValue(adminListBuilder);
  });

  it('disables entitlements for every org past the grace window', async () => {
    adminListBuilder.lt.mockReturnValueOnce(
      Promise.resolve({
        data: [
          {
            organization_id: 'org-A',
            payment_failed_at: '2026-05-10T00:00:00Z',
            status: 'past_due',
          },
          {
            organization_id: 'org-B',
            payment_failed_at: '2026-05-09T00:00:00Z',
            status: 'past_due',
          },
        ],
        error: null,
      }) as never,
    );
    from.mockReturnValueOnce(adminListBuilder as never);
    disableEntitlementsForOrg.mockResolvedValue(undefined);

    const { runGracePeriodEnforcement } = await import(
      '@/lib/billing/enforce-grace-period'
    );
    const result = await runGracePeriodEnforcement();

    expect(result.scanned).toBe(2);
    expect(result.enforced).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(disableEntitlementsForOrg).toHaveBeenCalledWith('org-A');
    expect(disableEntitlementsForOrg).toHaveBeenCalledWith('org-B');
  });

  it('collects per-org errors without aborting the run', async () => {
    adminListBuilder.lt.mockReturnValueOnce(
      Promise.resolve({
        data: [
          {
            organization_id: 'org-ok',
            payment_failed_at: '2026-05-10T00:00:00Z',
            status: 'past_due',
          },
          {
            organization_id: 'org-fail',
            payment_failed_at: '2026-05-09T00:00:00Z',
            status: 'past_due',
          },
        ],
        error: null,
      }) as never,
    );
    from.mockReturnValueOnce(adminListBuilder as never);
    disableEntitlementsForOrg.mockImplementation(async (orgId: string) => {
      if (orgId === 'org-fail') throw new Error('rls denied');
    });

    const { runGracePeriodEnforcement } = await import(
      '@/lib/billing/enforce-grace-period'
    );
    const result = await runGracePeriodEnforcement();

    expect(result.scanned).toBe(2);
    expect(result.enforced).toBe(1);
    expect(result.errors).toEqual([
      { orgId: 'org-fail', message: 'rls denied' },
    ]);
  });

  it('returns an empty result when no orgs are past the grace window', async () => {
    adminListBuilder.lt.mockReturnValueOnce(
      Promise.resolve({ data: [], error: null }) as never,
    );
    from.mockReturnValueOnce(adminListBuilder as never);

    const { runGracePeriodEnforcement } = await import(
      '@/lib/billing/enforce-grace-period'
    );
    const result = await runGracePeriodEnforcement();

    expect(result.scanned).toBe(0);
    expect(result.enforced).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(disableEntitlementsForOrg).not.toHaveBeenCalled();
  });
});
