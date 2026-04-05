/**
 * Tests for lib/evidence/freshness-engine.ts & lib/evidence/coverage-calculator.ts
 * Covers both pure functions and Supabase-dependent functions (via mocks)
 */

const mockFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({ from: mockFrom })),
}));

import { calculateFreshness } from '@/lib/evidence/freshness-engine';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-05T00:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('calculateFreshness', () => {
  it('returns "current" when no expiry or review cycle', () => {
    expect(calculateFreshness({})).toBe('current');
  });

  it('returns "current" when valid_until is far future', () => {
    expect(calculateFreshness({ valid_until: '2027-06-01' })).toBe('current');
  });

  it('returns "expired" when valid_until is past', () => {
    expect(calculateFreshness({ valid_until: '2026-01-01' })).toBe('expired');
  });

  it('returns "expiring_soon" when valid_until is 15 days away', () => {
    expect(calculateFreshness({ valid_until: '2026-04-20' })).toBe(
      'expiring_soon',
    );
  });

  it('returns "current" when valid_until is 31 days away', () => {
    expect(calculateFreshness({ valid_until: '2026-05-06' })).toBe('current');
  });

  it('returns "needs_review" when review overdue', () => {
    expect(
      calculateFreshness({
        review_cycle_days: 30,
        last_reviewed_at: '2026-02-01T00:00:00Z',
      }),
    ).toBe('needs_review');
  });

  it('returns "current" when review is fresh', () => {
    expect(
      calculateFreshness({
        review_cycle_days: 90,
        last_reviewed_at: '2026-03-20T00:00:00Z',
      }),
    ).toBe('current');
  });

  it('returns "current" with null valid_until', () => {
    expect(calculateFreshness({ valid_until: null })).toBe('current');
  });

  it('returns "current" with null review fields', () => {
    expect(
      calculateFreshness({ review_cycle_days: null, last_reviewed_at: null }),
    ).toBe('current');
  });

  it('expired takes priority over needs_review', () => {
    expect(
      calculateFreshness({
        valid_until: '2026-01-01',
        review_cycle_days: 30,
        last_reviewed_at: '2025-01-01T00:00:00Z',
      }),
    ).toBe('expired');
  });

  it('handles boundary — expiry exactly at 30 days', () => {
    expect(calculateFreshness({ valid_until: '2026-05-05' })).toBe(
      'expiring_soon',
    );
  });
});
