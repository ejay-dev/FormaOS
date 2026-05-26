/**
 * Tests for lib/security/account-lockout.ts (H3 — 2026-05-26).
 *
 * Three behaviours under coverage:
 *   1. Below the threshold: failures increment but the account is
 *      not locked; isAccountLocked returns { locked: false }.
 *   2. At/above the threshold: isAccountLocked returns
 *      { locked: true, retryAfterSeconds } sourced from the Redis TTL.
 *   3. Successful login (clearLockout) wipes the counter entirely.
 *
 * Redis is mocked with an in-memory map; the real module is exercised
 * unchanged.
 */

jest.mock('server-only', () => ({}));

const memory = new Map<string, number>();
const ttlMap = new Map<string, number>();

const mockRedis = {
  incr: jest.fn(async (k: string) => {
    const next = (memory.get(k) ?? 0) + 1;
    memory.set(k, next);
    return next;
  }),
  expire: jest.fn(async (k: string, seconds: number) => {
    ttlMap.set(k, seconds);
    return 1;
  }),
  get: jest.fn(async (k: string) => memory.get(k) ?? null),
  ttl: jest.fn(async (k: string) => ttlMap.get(k) ?? -2),
  del: jest.fn(async (k: string) => {
    memory.delete(k);
    ttlMap.delete(k);
    return 1;
  }),
};

jest.mock('@/lib/redis/client', () => ({
  getRedisClient: () => mockRedis,
}));

import {
  ACCOUNT_LOCKOUT_THRESHOLD,
  clearLockout,
  isAccountLocked,
  recordLoginFailure,
} from '@/lib/security/account-lockout';

describe('account-lockout', () => {
  beforeEach(() => {
    memory.clear();
    ttlMap.clear();
    mockRedis.incr.mockClear();
    mockRedis.expire.mockClear();
    mockRedis.get.mockClear();
    mockRedis.ttl.mockClear();
    mockRedis.del.mockClear();
  });

  it('returns locked: false for an email with no prior failures', async () => {
    const status = await isAccountLocked('Alice@Example.com');
    expect(status.locked).toBe(false);
    expect(status.failureCount).toBe(0);
  });

  it('increments the counter and keeps the account unlocked under threshold', async () => {
    for (let i = 1; i < ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      const c = await recordLoginFailure('bob@example.com');
      expect(c).toBe(i);
    }
    const status = await isAccountLocked('BOB@EXAMPLE.COM');
    expect(status.locked).toBe(false);
    expect(status.failureCount).toBe(ACCOUNT_LOCKOUT_THRESHOLD - 1);
  });

  it('locks the account on the threshold-th failure and reports retryAfterSeconds', async () => {
    for (let i = 0; i < ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      await recordLoginFailure('carol@example.com');
    }
    const status = await isAccountLocked('carol@example.com');
    expect(status.locked).toBe(true);
    expect(status.failureCount).toBe(ACCOUNT_LOCKOUT_THRESHOLD);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('clearLockout wipes the counter so the next call sees fresh state', async () => {
    for (let i = 0; i < ACCOUNT_LOCKOUT_THRESHOLD; i++) {
      await recordLoginFailure('dave@example.com');
    }
    expect((await isAccountLocked('dave@example.com')).locked).toBe(true);
    await clearLockout('dave@example.com');
    const status = await isAccountLocked('dave@example.com');
    expect(status.locked).toBe(false);
    expect(status.failureCount).toBe(0);
  });

  it('treats email case-insensitively (lowercases the key)', async () => {
    await recordLoginFailure('Eve@Example.com');
    await recordLoginFailure('EVE@example.COM');
    const status = await isAccountLocked('eve@example.com');
    expect(status.failureCount).toBe(2);
  });
});
