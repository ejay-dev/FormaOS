/** @jest-environment node */

import {
  cacheOrCompute,
  clearCache,
  createCacheKey,
  getCacheStats,
  getFromCache,
  invalidateCacheByPrefix,
} from '@/lib/cache/dashboard-cache';

describe('dashboard cache safety', () => {
  beforeEach(() => {
    clearCache();
  });

  it('does not mix org-scoped cache entries when concurrent callers interleave', async () => {
    // Audit 2026-08-03 — the previous version of this test warmed both keys
    // first and then looped 250 sequential `await`s. Every iteration was a
    // cache hit, so the compute callbacks never ran and `a`/`b` were the
    // literal objects stored during the warm-up; the assertions could only
    // have failed if `createCacheKey` (a string join) collided. Nothing was
    // ever concurrent, so the real hazard in `cacheOrCompute` — the
    // check-then-act window between `getFromCache` returning null and
    // `setCache` writing — was never exercised.
    //
    // Here all 500 calls are issued before any of them settles (the loop
    // only pushes promises), both keys are cold so every caller enters the
    // compute path, and org-a's compute deliberately resolves AFTER org-b's
    // so the two settle out of order inside that window.
    const orgAKey = createCacheKey('dashboard', 'stats', 'org-a');
    const orgBKey = createCacheKey('dashboard', 'stats', 'org-b');

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const computeCalls = { a: 0, b: 0 };

    const computeA = async () => {
      computeCalls.a += 1;
      await delay(20);
      return { org: 'a', value: computeCalls.a };
    };
    const computeB = async () => {
      computeCalls.b += 1;
      await delay(0);
      return { org: 'b', value: computeCalls.b };
    };

    const pending: Array<Promise<{ org: string; value: number }>> = [];
    for (let i = 0; i < 250; i++) {
      pending.push(cacheOrCompute(orgAKey, computeA));
      pending.push(cacheOrCompute(orgBKey, computeB));
    }

    const settled = await Promise.all(pending);

    // Even-indexed callers asked for org-a, odd-indexed for org-b. A caller
    // that receives the other org's payload is a cross-tenant leak.
    settled.forEach((value, index) => {
      expect(value.org).toBe(index % 2 === 0 ? 'a' : 'b');
    });

    expect(getFromCache<{ org: string }>(orgAKey)?.org).toBe('a');
    expect(getFromCache<{ org: string }>(orgBKey)?.org).toBe('b');
    expect(getCacheStats().keys.sort()).toEqual([orgAKey, orgBKey].sort());
  });

  it('caches a value only under the key its compute was requested for', async () => {
    // Guards the write side of the same window: whichever caller wins the
    // race, the value stored under a key must have come from that key's
    // compute. A regression that hoisted the pending key into module scope
    // (a common single-flight refactor bug) would cross the two entries.
    const orgAKey = createCacheKey('dashboard', 'stats', 'org-a');
    const orgBKey = createCacheKey('dashboard', 'stats', 'org-b');

    const [a, b] = await Promise.all([
      cacheOrCompute(orgAKey, async () => ({ org: 'a' })),
      cacheOrCompute(orgBKey, async () => ({ org: 'b' })),
    ]);

    expect(a.org).toBe('a');
    expect(b.org).toBe('b');
    expect(getFromCache<{ org: string }>(orgAKey)).toEqual({ org: 'a' });
    expect(getFromCache<{ org: string }>(orgBKey)).toEqual({ org: 'b' });
  });

  it('does not cache anything when a compute rejects', async () => {
    const orgAKey = createCacheKey('dashboard', 'stats', 'org-a');
    const orgBKey = createCacheKey('dashboard', 'stats', 'org-b');

    await cacheOrCompute(orgBKey, async () => ({ org: 'b' }));

    await expect(
      cacheOrCompute(orgAKey, async () => {
        throw new Error('org-a compute failed');
      }),
    ).rejects.toThrow('org-a compute failed');

    // The failure must not leave a poisoned entry behind, and must not touch
    // the other tenant's entry.
    expect(getFromCache(orgAKey)).toBeNull();
    expect(getFromCache<{ org: string }>(orgBKey)).toEqual({ org: 'b' });
  });

  it('invalidates by prefix without evicting a sibling org', async () => {
    const orgAKey = createCacheKey('dashboard', 'stats', 'org-a');
    const orgBKey = createCacheKey('dashboard', 'stats', 'org-b');

    await cacheOrCompute(orgAKey, async () => ({ org: 'a' }));
    await cacheOrCompute(orgBKey, async () => ({ org: 'b' }));

    invalidateCacheByPrefix(createCacheKey('dashboard', 'stats', 'org-a'));

    expect(getFromCache(orgAKey)).toBeNull();
    expect(getFromCache<{ org: string }>(orgBKey)).toEqual({ org: 'b' });
  });

  it('stops serving an org entry once its TTL has elapsed', async () => {
    const orgAKey = createCacheKey('dashboard', 'stats', 'org-a');

    await cacheOrCompute(orgAKey, async () => ({ org: 'a', value: 1 }), 10);
    expect(getFromCache<{ value: number }>(orgAKey)?.value).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(getFromCache(orgAKey)).toBeNull();
    const recomputed = await cacheOrCompute(
      orgAKey,
      async () => ({ org: 'a', value: 2 }),
      10,
    );
    expect(recomputed.value).toBe(2);
  });
});
