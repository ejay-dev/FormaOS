/**
 * Tests for lib/search/search-engine.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'not',
    'ilike',
    'like',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'in',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import {
  search,
  suggest,
  trackSearch,
  trackClick,
  getSearchAnalytics,
} from '@/lib/search/search-engine';

beforeEach(() => jest.clearAllMocks());

describe('search', () => {
  it('returns full-text search results when rpc succeeds', async () => {
    const rpcResult = [
      {
        entity_type: 'task',
        entity_id: 't1',
        title: 'Fix Bug',
        snippet: 'desc',
        rank: 1.0,
        metadata: {},
      },
    ];
    const client = {
      rpc: jest.fn().mockReturnValue({ data: rpcResult, error: null }),
      from: jest.fn(() => createBuilder()),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await search('org-1', 'bug');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe('Fix Bug');
  });

  it('filters by date range when options.from/to provided', async () => {
    const rpcResult = [
      {
        entity_type: 'task',
        entity_id: 't1',
        title: 'Old',
        snippet: '',
        rank: 1,
        metadata: { created_at: '2023-01-01' },
      },
      {
        entity_type: 'task',
        entity_id: 't2',
        title: 'New',
        snippet: '',
        rank: 1,
        metadata: { created_at: '2024-06-01' },
      },
    ];
    const client = {
      rpc: jest.fn().mockReturnValue({ data: rpcResult, error: null }),
      from: jest.fn(() => createBuilder()),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await search('org-1', 'task', { from: '2024-01-01' });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe('New');
  });

  it('filters by to date', async () => {
    const rpcResult = [
      {
        entity_type: 'task',
        entity_id: 't1',
        title: 'Old',
        snippet: '',
        rank: 1,
        metadata: { created_at: '2023-01-01' },
      },
      {
        entity_type: 'task',
        entity_id: 't2',
        title: 'New',
        snippet: '',
        rank: 1,
        metadata: { created_at: '2024-06-01' },
      },
    ];
    const client = {
      rpc: jest.fn().mockReturnValue({ data: rpcResult, error: null }),
      from: jest.fn(() => createBuilder()),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await search('org-1', 'task', { to: '2023-06-01' });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe('Old');
  });

  it('falls back to trigram search when rpc returns empty', async () => {
    const client = {
      rpc: jest.fn().mockReturnValue({ data: [], error: null }),
      from: jest.fn(() =>
        createBuilder({
          data: [
            {
              entity_type: 'policy',
              entity_id: 'p1',
              title: 'Privacy Policy',
              body: 'A body text',
              metadata: {},
            },
          ],
          error: null,
        }),
      ),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await search('org-1', 'priv');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].snippet).toBe('A body text');
  });

  it('falls back to trigram search when rpc errors', async () => {
    const client = {
      rpc: jest
        .fn()
        .mockReturnValue({ data: null, error: { message: 'rpc fail' } }),
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await search('org-1', 'test');
    expect(result.results).toEqual([]);
  });

  it('limits results', async () => {
    const rpcResult = Array.from({ length: 5 }, (_, i) => ({
      entity_type: 'task',
      entity_id: `t${i}`,
      title: `Task ${i}`,
      snippet: '',
      rank: 1,
      metadata: {},
    }));
    const client = {
      rpc: jest.fn().mockReturnValue({ data: rpcResult, error: null }),
      from: jest.fn(() => createBuilder()),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await search('org-1', 'task', { limit: 200 }); // clamped to 100
    expect(result.results).toHaveLength(5);
  });
});

describe('suggest', () => {
  it('returns suggestions from recent searches and titles', async () => {
    const fromBuilder = createBuilder({
      data: [{ title: 'Security Policy' }],
      error: null,
    });
    const recentBuilder = createBuilder({
      data: [{ query: 'sec' }],
      error: null,
    });
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        return callCount === 1 ? recentBuilder : fromBuilder;
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const results = await suggest('org-1', 'sec', 'user-1');
    expect(results).toContain('sec');
    expect(results).toContain('Security Policy');
  });

  it('returns suggestions without userId', async () => {
    const fromBuilder = createBuilder({
      data: [{ title: 'Risk Assessment' }],
      error: null,
    });
    const client = { from: jest.fn(() => fromBuilder) };
    createSupabaseAdminClient.mockReturnValue(client);

    const results = await suggest('org-1', 'risk');
    expect(results).toContain('Risk Assessment');
  });

  it('deduplicates suggestions', async () => {
    const fromBuilder = createBuilder({
      data: [{ title: 'dup' }],
      error: null,
    });
    const recentBuilder = createBuilder({
      data: [{ query: 'dup' }],
      error: null,
    });
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        return callCount === 1 ? recentBuilder : fromBuilder;
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const results = await suggest('org-1', 'du', 'user-1');
    expect(results.filter((s: string) => s === 'dup')).toHaveLength(1);
  });
});

describe('trackSearch', () => {
  it('inserts a search history record', async () => {
    const builder = createBuilder({ data: null, error: null });
    const client = { from: jest.fn(() => builder) };
    createSupabaseAdminClient.mockReturnValue(client);

    await trackSearch('org-1', 'user-1', 'compliance', 5);
    expect(client.from).toHaveBeenCalledWith('search_history');
  });
});

describe('trackClick', () => {
  it('inserts a click record', async () => {
    const builder = createBuilder({ data: null, error: null });
    const client = { from: jest.fn(() => builder) };
    createSupabaseAdminClient.mockReturnValue(client);

    await trackClick('org-1', 'user-1', 'task', 't1');
    expect(client.from).toHaveBeenCalledWith('search_history');
  });
});

describe('getSearchAnalytics', () => {
  it('computes analytics from search history', async () => {
    const searches = [
      { query: 'compliance', result_count: 3, clicked_result_id: 'r1' },
      { query: 'compliance', result_count: 3, clicked_result_id: null },
      { query: 'security', result_count: 0, clicked_result_id: null },
      { query: 'audit', result_count: 5, clicked_result_id: 'r2' },
    ];
    const builder = createBuilder({ data: searches, error: null });
    const client = { from: jest.fn(() => builder) };
    createSupabaseAdminClient.mockReturnValue(client);

    const analytics = await getSearchAnalytics('org-1');
    expect(analytics.totalSearches).toBe(4);
    expect(analytics.uniqueQueries).toBe(3);
    expect(analytics.zeroResultRate).toBeCloseTo(0.25);
    expect(analytics.clickThroughRate).toBeCloseTo(0.5);
    expect(analytics.popularQueries[0].query).toBe('compliance');
  });

  it('handles empty search history', async () => {
    const builder = createBuilder({ data: [], error: null });
    const client = { from: jest.fn(() => builder) };
    createSupabaseAdminClient.mockReturnValue(client);

    const analytics = await getSearchAnalytics('org-1');
    expect(analytics.totalSearches).toBe(0);
    expect(analytics.zeroResultRate).toBe(0);
    expect(analytics.clickThroughRate).toBe(0);
  });
});
