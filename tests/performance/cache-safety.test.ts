/** @jest-environment node */

import {
  cacheOrCompute,
  clearCache,
  createCacheKey,
  getFromCache,
} from '@/lib/cache/dashboard-cache';

describe('dashboard cache safety', () => {
  beforeEach(() => {
    clearCache();
  });

  it('does not mix org-scoped cache entries under load', async () => {
    const orgAKey = createCacheKey('dashboard', 'stats', 'org-a');
    const orgBKey = createCacheKey('dashboard', 'stats', 'org-b');

    await cacheOrCompute(orgAKey, async () => ({ org: 'a', value: 1 }));
    await cacheOrCompute(orgBKey, async () => ({ org: 'b', value: 2 }));

    for (let i = 0; i < 250; i++) {
      const a = await cacheOrCompute(orgAKey, async () => ({ org: 'a', value: i }));
      const b = await cacheOrCompute(orgBKey, async () => ({ org: 'b', value: i }));

      expect(a.org).toBe('a');
      expect(b.org).toBe('b');
    }

    const cachedA = getFromCache<{ org: string }>(orgAKey);
    const cachedB = getFromCache<{ org: string }>(orgBKey);
    expect(cachedA?.org).toBe('a');
    expect(cachedB?.org).toBe('b');
  });
});
