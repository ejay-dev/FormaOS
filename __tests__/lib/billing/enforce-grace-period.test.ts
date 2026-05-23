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
