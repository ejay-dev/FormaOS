jest.mock('@/lib/supabase/server', () => {
  const query: Record<string, jest.Mock> = {};
  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.in = jest.fn(() => query);
  query.gte = jest.fn(() => query);
  query.lte = jest.fn(() => query);
  query.or = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.range = jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
  query.limit = jest.fn(() => query);
  query.insert = jest.fn(() => query);
  query.then = jest.fn((resolve: Function) => resolve({ data: null, error: null }));

  const client = { from: jest.fn(() => query) };

  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(client),
    __query: query,
    __client: client,
  };
});

import {
  logActivity,
  getActivityLogs,
  getEntityActivity,
  getUserActivitySummary,
  getActivityTrends,
  exportActivityLogs,
} from '@/lib/audit-trail';

function getQuery() {
  return require('@/lib/supabase/server').__query;
}

function getClient() {
  return require('@/lib/supabase/server').__client;
}

beforeEach(() => {
  jest.clearAllMocks();
  const query = getQuery();
  // Restore default thenable behavior
  query.range.mockResolvedValue({ data: [], error: null, count: 0 });
  query.then.mockImplementation((resolve: Function) => resolve({ data: null, error: null }));
  query.limit.mockReturnValue(query);
  query.order.mockReturnValue(query);
});

describe('logActivity', () => {
  it('inserts activity log record', async () => {
    const query = getQuery();
    await logActivity('org-1', 'user-1', 'create', 'task', {
      entityId: 'task-1',
      entityName: 'My Task',
    });
    expect(getClient().from).toHaveBeenCalledWith('activity_logs');
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        user_id: 'user-1',
        action: 'create',
        entity_type: 'task',
        entity_id: 'task-1',
        entity_name: 'My Task',
      }),
    );
  });

  it('handles optional fields', async () => {
    const query = getQuery();
    await logActivity('org-1', 'user-1', 'view', 'report');
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: undefined,
        entity_name: undefined,
      }),
    );
  });
});

describe('getActivityLogs', () => {
  it('returns logs and total from query', async () => {
    const query = getQuery();
    query.range.mockResolvedValueOnce({
      data: [{ id: 'log-1', action: 'create', profiles: { full_name: 'Test' } }],
      error: null,
      count: 1,
    });
    const result = await getActivityLogs('org-1');
    expect(result.total).toBe(1);
    expect(result.logs[0].user).toEqual({ full_name: 'Test' });
  });

  it('returns empty on error', async () => {
    const query = getQuery();
    query.range.mockResolvedValueOnce({ data: null, error: { message: 'err' }, count: 0 });
    const result = await getActivityLogs('org-1');
    expect(result.logs).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies filters', async () => {
    const query = getQuery();
    query.range.mockResolvedValueOnce({ data: [], error: null, count: 0 });
    await getActivityLogs('org-1', {
      filters: {
        userId: 'u1',
        actions: ['create'],
        entityTypes: ['task'],
        entityId: 'e1',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        search: 'test',
      },
    });
    // Verify filter methods were called
    expect(query.eq).toHaveBeenCalled();
    expect(query.in).toHaveBeenCalled();
    expect(query.gte).toHaveBeenCalled();
    expect(query.lte).toHaveBeenCalled();
    expect(query.or).toHaveBeenCalled();
  });
});

describe('getEntityActivity', () => {
  it('returns activities for an entity', async () => {
    const query = getQuery();
    query.limit.mockResolvedValueOnce({
      data: [{ id: 'log-1', profiles: { email: 'a@b.com' } }],
      error: null,
    });
    const result = await getEntityActivity('org-1', 'task', 'task-1');
    expect(result).toHaveLength(1);
    expect(result[0].user).toEqual({ email: 'a@b.com' });
  });

  it('returns empty on error', async () => {
    const query = getQuery();
    query.limit.mockResolvedValueOnce({ data: null, error: { message: 'err' } });
    const result = await getEntityActivity('org-1', 'task', 'task-1');
    expect(result).toEqual([]);
  });
});

describe('getUserActivitySummary', () => {
  it('calculates breakdowns from activity data', async () => {
    const query = getQuery();
    query.order.mockResolvedValueOnce({
      data: [
        { action: 'create', entity_type: 'task' },
        { action: 'create', entity_type: 'evidence' },
        { action: 'update', entity_type: 'task' },
      ],
      error: null,
    });
    const result = await getUserActivitySummary('org-1', 'user-1');
    expect(result.totalActions).toBe(3);
    expect(result.actionBreakdown.create).toBe(2);
    expect(result.actionBreakdown.update).toBe(1);
    expect(result.entityBreakdown.task).toBe(2);
    expect(result.entityBreakdown.evidence).toBe(1);
  });

  it('returns empty on error', async () => {
    const query = getQuery();
    query.order.mockResolvedValueOnce({ data: null, error: { message: 'err' } });
    const result = await getUserActivitySummary('org-1', 'user-1');
    expect(result.totalActions).toBe(0);
  });
});

describe('getActivityTrends', () => {
  it('groups activities by date', async () => {
    const query = getQuery();
    query.order.mockResolvedValueOnce({
      data: [
        { created_at: '2024-06-01T10:00:00Z', action: 'create' },
        { created_at: '2024-06-01T11:00:00Z', action: 'update' },
        { created_at: '2024-06-02T10:00:00Z', action: 'create' },
      ],
      error: null,
    });
    const result = await getActivityTrends('org-1');
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2024-06-01');
    expect(result[0].count).toBe(2);
    expect(result[1].date).toBe('2024-06-02');
    expect(result[1].count).toBe(1);
  });

  it('returns empty on error', async () => {
    const query = getQuery();
    query.order.mockResolvedValueOnce({ data: null, error: { message: 'err' } });
    const result = await getActivityTrends('org-1');
    expect(result).toEqual([]);
  });
});

describe('exportActivityLogs', () => {
  it('produces CSV with headers', async () => {
    const query = getQuery();
    query.range.mockResolvedValueOnce({
      data: [{
        created_at: '2024-01-01',
        action: 'create',
        entity_type: 'task',
        entity_name: 'My Task',
        details: {},
        ip_address: '1.2.3.4',
        profiles: { full_name: 'User' },
      }],
      error: null,
      count: 1,
    });
    const csv = await exportActivityLogs('org-1');
    expect(csv).toContain('Date,User,Action');
    expect(csv).toContain('create');
  });
});
