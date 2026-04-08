jest.mock('@/lib/supabase/admin', () => {
  const mockQuery: Record<string, any> = {};

  mockQuery.from = jest.fn(() => mockQuery);
  mockQuery.insert = jest.fn(() => Promise.resolve({ error: null }));
  mockQuery.select = jest.fn(() => mockQuery);
  mockQuery.gte = jest.fn(() => mockQuery);
  mockQuery.order = jest.fn(() => mockQuery);
  mockQuery.limit = jest.fn(() => Promise.resolve({ data: [], error: null }));

  return {
    createSupabaseAdminClient: jest.fn(() => mockQuery),
    __query: mockQuery,
  };
});

jest.mock('@/lib/redis/client', () => {
  const mockRedis: Record<string, any> = {
    lpush: jest.fn(() => Promise.resolve(1)),
    ltrim: jest.fn(() => Promise.resolve('OK')),
    lrange: jest.fn(() => Promise.resolve([])),
  };
  return {
    getRedisClient: jest.fn(() => mockRedis),
    __redis: mockRedis,
  };
});

function getMockQuery() {
  return require('@/lib/supabase/admin').__query;
}
function getMockRedis() {
  return require('@/lib/redis/client').__redis;
}
function getRedisClientFn() {
  return require('@/lib/redis/client').getRedisClient;
}

import {
  appendPublicUptimeCheck,
  fetchPublicUptimeChecks,
} from '@/lib/status/public-uptime';

describe('appendPublicUptimeCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const q = getMockQuery();
    q.insert.mockResolvedValue({ error: null });
    getMockRedis().lpush.mockResolvedValue(1);
    getMockRedis().ltrim.mockResolvedValue('OK');
  });

  it('inserts into DB and returns stored=db on success', async () => {
    const result = await appendPublicUptimeCheck({
      ok: true,
      latency_ms: 42,
      source: 'test',
    });
    expect(result).toEqual({ ok: true, stored: 'db' });
    expect(getMockQuery().from).toHaveBeenCalledWith('public_uptime_checks');
  });

  it('falls back to Redis when table is missing (PGRST205)', async () => {
    getMockQuery().insert.mockResolvedValue({
      error: { code: 'PGRST205', message: 'schema cache lookup' },
    });
    const result = await appendPublicUptimeCheck({
      ok: true,
      latency_ms: 10,
      source: 'cron',
    });
    expect(result).toEqual({ ok: true, stored: 'redis' });
    expect(getMockRedis().lpush).toHaveBeenCalled();
    expect(getMockRedis().ltrim).toHaveBeenCalled();
  });

  it('returns stored=none with error when insert fails with non-table error', async () => {
    getMockQuery().insert.mockResolvedValue({
      error: { code: '42000', message: 'permission denied' },
    });
    const result = await appendPublicUptimeCheck({
      ok: false,
      latency_ms: null,
      source: 'test',
    });
    expect(result.ok).toBe(false);
    expect(result.stored).toBe('none');
    expect(result.error).toBe('permission denied');
  });

  it('returns stored=none when Redis is not configured', async () => {
    getMockQuery().insert.mockResolvedValue({
      error: { code: 'PGRST205', message: 'does not exist' },
    });
    getRedisClientFn().mockReturnValue(null);
    const result = await appendPublicUptimeCheck({
      ok: true,
      latency_ms: 5,
      source: 'test',
    });
    expect(result.ok).toBe(false);
    expect(result.stored).toBe('none');
    expect(result.error).toContain('Redis not configured');
  });

  it('catches insert exception for missing table and falls back to Redis', async () => {
    getMockQuery().insert.mockRejectedValue(
      new Error('relation "public_uptime_checks" does not exist'),
    );
    getRedisClientFn().mockReturnValue(getMockRedis());
    const result = await appendPublicUptimeCheck({
      ok: true,
      latency_ms: 1,
      source: 'test',
    });
    expect(result).toEqual({ ok: true, stored: 'redis' });
  });

  it('catches insert exception for non-table error', async () => {
    getMockQuery().insert.mockRejectedValue(new Error('connection refused'));
    const result = await appendPublicUptimeCheck({
      ok: true,
      latency_ms: 1,
      source: 'test',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('connection refused');
  });

  it('catches Redis error gracefully', async () => {
    getMockQuery().insert.mockResolvedValue({
      error: { code: 'PGRST205', message: 'schema cache' },
    });
    getRedisClientFn().mockReturnValue(getMockRedis());
    getMockRedis().lpush.mockRejectedValue(new Error('redis down'));
    const result = await appendPublicUptimeCheck({
      ok: true,
      latency_ms: 1,
      source: 'test',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('redis down');
  });
});

describe('fetchPublicUptimeChecks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const q = getMockQuery();
    q.limit.mockResolvedValue({ data: [], error: null });
    getRedisClientFn().mockReturnValue(getMockRedis());
  });

  it('returns rows from DB', async () => {
    const rows = [
      {
        checked_at: '2025-01-02T00:00:00Z',
        ok: true,
        latency_ms: 20,
        source: 'cron',
      },
    ];
    getMockQuery().limit.mockResolvedValue({ data: rows, error: null });
    const result = await fetchPublicUptimeChecks({
      sinceIso: '2025-01-01T00:00:00Z',
      limit: 10,
    });
    expect(result).toEqual(rows);
    expect(getMockQuery().from).toHaveBeenCalledWith('public_uptime_checks');
    expect(getMockQuery().gte).toHaveBeenCalledWith(
      'checked_at',
      '2025-01-01T00:00:00Z',
    );
  });

  it('falls back to Redis when table missing', async () => {
    getMockQuery().limit.mockResolvedValue({
      data: null,
      error: { code: 'PGRST205', message: 'schema cache' },
    });
    const json = JSON.stringify({
      checked_at: '2025-01-02T00:00:00Z',
      ok: true,
      latency_ms: 5,
      source: 'cron',
    });
    getMockRedis().lrange.mockResolvedValue([json]);
    const result = await fetchPublicUptimeChecks({
      sinceIso: '2025-01-01T00:00:00Z',
      limit: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0].ok).toBe(true);
  });

  it('returns empty array when DB has a non-table error', async () => {
    getMockQuery().limit.mockResolvedValue({
      data: null,
      error: { code: '42000', message: 'permission denied' },
    });
    const result = await fetchPublicUptimeChecks({
      sinceIso: '2025-01-01T00:00:00Z',
      limit: 10,
    });
    expect(result).toEqual([]);
  });

  it('returns empty array when Redis is not configured', async () => {
    getMockQuery().limit.mockResolvedValue({
      data: null,
      error: { code: 'PGRST205', message: 'does not exist' },
    });
    getRedisClientFn().mockReturnValue(null);
    const result = await fetchPublicUptimeChecks({
      sinceIso: '2025-01-01T00:00:00Z',
      limit: 5,
    });
    expect(result).toEqual([]);
  });

  it('filters Redis records by sinceIso', async () => {
    getMockQuery().limit.mockResolvedValue({
      data: null,
      error: { code: 'PGRST205', message: 'schema cache' },
    });
    const old = JSON.stringify({
      checked_at: '2024-12-01T00:00:00Z',
      ok: true,
      latency_ms: 5,
      source: 'cron',
    });
    const recent = JSON.stringify({
      checked_at: '2025-06-01T00:00:00Z',
      ok: false,
      latency_ms: 100,
      source: 'cron',
    });
    getMockRedis().lrange.mockResolvedValue([old, recent]);
    const result = await fetchPublicUptimeChecks({
      sinceIso: '2025-01-01T00:00:00Z',
      limit: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0].checked_at).toBe('2025-06-01T00:00:00Z');
  });

  it('skips unparseable Redis entries', async () => {
    getMockQuery().limit.mockResolvedValue({
      data: null,
      error: { code: 'PGRST205', message: 'does not exist' },
    });
    getMockRedis().lrange.mockResolvedValue(['not-json', '{}']);
    const result = await fetchPublicUptimeChecks({
      sinceIso: '2000-01-01T00:00:00Z',
      limit: 10,
    });
    // '{}' has no checked_at so is filtered; 'not-json' throws parse error → null
    expect(result).toEqual([]);
  });

  it('catches DB exception for missing table and falls back to Redis', async () => {
    getMockQuery().limit.mockRejectedValue(
      new Error('relation "public_uptime_checks" does not exist'),
    );
    getMockRedis().lrange.mockResolvedValue([]);
    const result = await fetchPublicUptimeChecks({
      sinceIso: '2025-01-01T00:00:00Z',
      limit: 10,
    });
    expect(result).toEqual([]);
  });
});
