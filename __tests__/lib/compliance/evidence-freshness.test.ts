/**
 * Tests for lib/evidence/freshness-engine.ts — pure calculateFreshness function
 */

import { calculateFreshness } from '@/lib/evidence/freshness-engine';

describe('calculateFreshness', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-05T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "current" when no expiry or review cycle', () => {
    expect(calculateFreshness({})).toBe('current');
  });

  it('returns "current" when valid_until is far in the future', () => {
    expect(calculateFreshness({ valid_until: '2027-01-01' })).toBe('current');
  });

  it('returns "expired" when valid_until is in the past', () => {
    expect(calculateFreshness({ valid_until: '2026-01-01' })).toBe('expired');
  });

  it('returns "expiring_soon" when valid_until is within 30 days', () => {
    expect(calculateFreshness({ valid_until: '2026-04-20' })).toBe(
      'expiring_soon',
    );
  });

  it('returns "expiring_soon" when valid_until is exactly 30 days', () => {
    expect(calculateFreshness({ valid_until: '2026-05-05' })).toBe(
      'expiring_soon',
    );
  });

  it('returns "current" when valid_until is 31 days away', () => {
    expect(calculateFreshness({ valid_until: '2026-05-06' })).toBe('current');
  });

  it('returns "needs_review" when review cycle is exceeded', () => {
    expect(
      calculateFreshness({
        review_cycle_days: 30,
        last_reviewed_at: '2026-01-01T00:00:00Z',
      }),
    ).toBe('needs_review');
  });

  it('returns "current" when review cycle is not exceeded', () => {
    expect(
      calculateFreshness({
        review_cycle_days: 90,
        last_reviewed_at: '2026-03-15T00:00:00Z',
      }),
    ).toBe('current');
  });

  it('returns "current" when review_cycle_days set but no last_reviewed_at', () => {
    expect(
      calculateFreshness({
        review_cycle_days: 30,
        last_reviewed_at: null,
      }),
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

  it('handles null valid_until', () => {
    expect(calculateFreshness({ valid_until: null })).toBe('current');
  });
});
