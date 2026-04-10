/**
 * Branch-coverage tests for lib/audit-trail.ts
 * Targets uncovered branches in getActivityLogs filters, getUserActivitySummary,
 * getActivityTrends, exportActivityLogs, getMostActiveUsers, detectSuspiciousActivity
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null, count: 0 }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'filter',
    'match',
    'or',
    'single',
    'maybeSingle',
    'ilike',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let mockBuilder: any;
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn(() => mockBuilder),
  })),
}));

import {
  logActivity,
  getActivityLogs,
  getEntityActivity,
  getUserActivitySummary,
  getActivityTrends,
  exportActivityLogs,
  getMostActiveUsers,
  detectSuspiciousActivity,
} from '@/lib/audit-trail';

describe('logActivity', () => {
  it('inserts an activity log', async () => {
    mockBuilder = createBuilder({ data: null, error: null });
    await logActivity('org1', 'u1', 'create', 'task', {
      entityId: 'e1',
      entityName: 'My Task',
      details: { foo: 'bar' },
      ipAddress: '1.2.3.4',
      userAgent: 'Chrome',
    });
    // No error means success
  });

  it('inserts with no options', async () => {
    mockBuilder = createBuilder({ data: null, error: null });
    await logActivity('org1', 'u1', 'view', 'evidence');
  });
});

describe('getActivityLogs', () => {
  it('returns logs with defaults', async () => {
    const log = { id: 'l1', action: 'create', profiles: { full_name: 'Test' } };
    mockBuilder = createBuilder({ data: [log], error: null, count: 1 });
    const result = await getActivityLogs('org1');
    expect(result.logs.length).toBe(1);
    expect(result.logs[0].user).toEqual({ full_name: 'Test' });
  });

  it('returns empty on error', async () => {
    mockBuilder = createBuilder({
      data: null,
      error: { message: 'fail' },
      count: 0,
    });
    const result = await getActivityLogs('org1');
    expect(result.logs).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies userId filter', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await getActivityLogs('org1', { filters: { userId: 'u1' } });
    expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('applies actions filter', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await getActivityLogs('org1', {
      filters: { actions: ['create', 'delete'] },
    });
    expect(mockBuilder.in).toHaveBeenCalledWith('action', ['create', 'delete']);
  });

  it('applies entityTypes filter', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await getActivityLogs('org1', {
      filters: { entityTypes: ['task', 'evidence'] },
    });
    expect(mockBuilder.in).toHaveBeenCalledWith('entity_type', [
      'task',
      'evidence',
    ]);
  });

  it('applies entityId filter', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await getActivityLogs('org1', { filters: { entityId: 'ent1' } });
    expect(mockBuilder.eq).toHaveBeenCalledWith('entity_id', 'ent1');
  });

  it('applies dateFrom filter', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await getActivityLogs('org1', { filters: { dateFrom: '2024-01-01' } });
    expect(mockBuilder.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
  });

  it('applies dateTo filter', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await getActivityLogs('org1', { filters: { dateTo: '2024-12-31' } });
    expect(mockBuilder.lte).toHaveBeenCalledWith('created_at', '2024-12-31');
  });

  it('applies search filter', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await getActivityLogs('org1', { filters: { search: 'deploy' } });
    expect(mockBuilder.or).toHaveBeenCalled();
  });

  it('applies limit and offset', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await getActivityLogs('org1', { limit: 10, offset: 20 });
    expect(mockBuilder.range).toHaveBeenCalledWith(20, 29);
  });

  it('handles null count', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: null });
    const result = await getActivityLogs('org1');
    expect(result.total).toBe(0);
  });
});

describe('getEntityActivity', () => {
  it('returns mapped logs', async () => {
    const log = { id: 'l1', profiles: { email: 'a@b.com' } };
    mockBuilder = createBuilder({ data: [log], error: null });
    const result = await getEntityActivity('org1', 'task', 't1');
    expect(result.length).toBe(1);
    expect(result[0].user).toEqual({ email: 'a@b.com' });
  });

  it('returns empty on error', async () => {
    mockBuilder = createBuilder({ data: null, error: { message: 'fail' } });
    const result = await getEntityActivity('org1', 'task', 't1');
    expect(result).toEqual([]);
  });
});

describe('getUserActivitySummary', () => {
  it('calculates breakdowns', async () => {
    const logs = [
      { action: 'create', entity_type: 'task' },
      { action: 'create', entity_type: 'evidence' },
      { action: 'delete', entity_type: 'task' },
    ];
    mockBuilder = createBuilder({ data: logs, error: null });
    const result = await getUserActivitySummary('org1', 'u1');
    expect(result.totalActions).toBe(3);
    expect(result.actionBreakdown.create).toBe(2);
    expect(result.actionBreakdown.delete).toBe(1);
    expect(result.entityBreakdown.task).toBe(2);
    expect(result.entityBreakdown.evidence).toBe(1);
    expect(result.recentActivity.length).toBe(3);
  });

  it('returns zero on error', async () => {
    mockBuilder = createBuilder({ data: null, error: { message: 'fail' } });
    const result = await getUserActivitySummary('org1', 'u1');
    expect(result.totalActions).toBe(0);
    expect(result.recentActivity).toEqual([]);
  });

  it('uses custom days parameter', async () => {
    mockBuilder = createBuilder({ data: [], error: null });
    await getUserActivitySummary('org1', 'u1', 7);
    expect(mockBuilder.gte).toHaveBeenCalled();
  });
});

describe('getActivityTrends', () => {
  it('groups by date', async () => {
    const logs = [
      { created_at: '2024-01-15T10:00:00Z', action: 'create' },
      { created_at: '2024-01-15T11:00:00Z', action: 'update' },
      { created_at: '2024-01-16T10:00:00Z', action: 'create' },
    ];
    mockBuilder = createBuilder({ data: logs, error: null });
    const result = await getActivityTrends('org1');
    expect(result.length).toBe(2);
    expect(result[0].date).toBe('2024-01-15');
    expect(result[0].count).toBe(2);
    expect(result[0].actions.create).toBe(1);
    expect(result[0].actions.update).toBe(1);
  });

  it('returns empty on error', async () => {
    mockBuilder = createBuilder({ data: null, error: { message: 'fail' } });
    const result = await getActivityTrends('org1');
    expect(result).toEqual([]);
  });
});

describe('exportActivityLogs', () => {
  it('generates CSV with headers and rows', async () => {
    const log = {
      created_at: '2024-01-15T10:00:00Z',
      action: 'create',
      entity_type: 'task',
      entity_name: 'My Task',
      details: { desc: 'test' },
      ip_address: '1.2.3.4',
      profiles: { full_name: 'John' },
    };
    mockBuilder = createBuilder({ data: [log], error: null, count: 1 });
    const csv = await exportActivityLogs('org1');
    expect(csv).toContain('Date,User,Action');
    expect(csv).toContain('John');
    expect(csv).toContain('My Task');
  });

  it('handles missing user info', async () => {
    const log = {
      created_at: '2024-01-15T10:00:00Z',
      action: 'view',
      entity_type: 'evidence',
      profiles: null,
    };
    mockBuilder = createBuilder({ data: [log], error: null, count: 1 });
    const csv = await exportActivityLogs('org1');
    expect(csv).toContain('Unknown');
  });

  it('applies filters to export', async () => {
    mockBuilder = createBuilder({ data: [], error: null, count: 0 });
    await exportActivityLogs('org1', { userId: 'u1' });
    expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });
});

describe('getMostActiveUsers', () => {
  it('returns top users sorted by count', async () => {
    const logs = [
      { user_id: 'u1', profiles: { full_name: 'Alice' } },
      { user_id: 'u1', profiles: { full_name: 'Alice' } },
      { user_id: 'u1', profiles: { full_name: 'Alice' } },
      { user_id: 'u2', profiles: { full_name: 'Bob' } },
    ];
    mockBuilder = createBuilder({ data: logs, error: null });
    const result = await getMostActiveUsers('org1');
    expect(result[0].userId).toBe('u1');
    expect(result[0].actionCount).toBe(3);
    expect(result[1].actionCount).toBe(1);
  });

  it('returns empty on error', async () => {
    mockBuilder = createBuilder({ data: null, error: { message: 'fail' } });
    const result = await getMostActiveUsers('org1');
    expect(result).toEqual([]);
  });

  it('handles users with email only', async () => {
    const logs = [{ user_id: 'u1', profiles: { email: 'a@b.com' } }];
    mockBuilder = createBuilder({ data: logs, error: null });
    const result = await getMostActiveUsers('org1');
    expect(result[0].userName).toBe('a@b.com');
  });
});

describe('detectSuspiciousActivity', () => {
  it('detects excessive failed logins', async () => {
    const failedLogins = Array.from({ length: 10 }, (_, _i) => ({
      user_id: 'u1',
      action: 'login',
      details: { status: 'failed' },
      created_at: '2024-01-15T10:00:00Z',
    }));
    mockBuilder = createBuilder({ data: failedLogins, error: null });
    const alerts = await detectSuspiciousActivity('org1');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts[0].type).toBe('excessive_failed_logins');
    expect(alerts[0].severity).toBe('high');
  });

  it('detects medium severity failed logins (5-9)', async () => {
    const failedLogins = Array.from({ length: 6 }, () => ({
      user_id: 'u2',
      action: 'login',
      details: { status: 'failed' },
      created_at: '2024-01-15T10:00:00Z',
    }));
    mockBuilder = createBuilder({ data: failedLogins, error: null });
    const alerts = await detectSuspiciousActivity('org1');
    const loginAlert = alerts.find(
      (a: any) => a.type === 'excessive_failed_logins',
    );
    expect(loginAlert?.severity).toBe('medium');
  });

  it('detects mass deletions', async () => {
    const deletions = Array.from({ length: 25 }, () => ({
      user_id: 'u1',
      action: 'delete',
      created_at: '2024-01-15T10:00:00Z',
    }));
    mockBuilder = createBuilder({ data: deletions, error: null });
    const alerts = await detectSuspiciousActivity('org1');
    const deleteAlert = alerts.find((a: any) => a.type === 'mass_deletions');
    expect(deleteAlert?.severity).toBe('high');
  });

  it('detects medium severity mass deletions (10-19)', async () => {
    const deletions = Array.from({ length: 12 }, () => ({
      user_id: 'u1',
      action: 'delete',
      created_at: '2024-01-15T10:00:00Z',
    }));
    mockBuilder = createBuilder({ data: deletions, error: null });
    const alerts = await detectSuspiciousActivity('org1');
    const deleteAlert = alerts.find((a: any) => a.type === 'mass_deletions');
    expect(deleteAlert?.severity).toBe('medium');
  });

  it('detects unusual time access', async () => {
    // Create timestamps at 3 AM local time
    const base = new Date();
    base.setHours(3, 0, 0, 0);
    const nightAccess = Array.from({ length: 6 }, () => ({
      user_id: 'u1',
      action: 'view',
      created_at: base.toISOString(),
    }));
    mockBuilder = createBuilder({ data: nightAccess, error: null });
    const alerts = await detectSuspiciousActivity('org1');
    const timeAlert = alerts.find((a: any) => a.type === 'unusual_time_access');
    expect(timeAlert).toBeDefined();
    expect(timeAlert?.severity).toBe('low');
  });

  it('returns empty on error', async () => {
    mockBuilder = createBuilder({ data: null, error: { message: 'fail' } });
    const alerts = await detectSuspiciousActivity('org1');
    expect(alerts).toEqual([]);
  });

  it('returns no alerts for normal activity', async () => {
    const normalLogs = [
      { user_id: 'u1', action: 'view', created_at: '2024-01-15T10:00:00Z' },
      { user_id: 'u2', action: 'create', created_at: '2024-01-15T11:00:00Z' },
    ];
    mockBuilder = createBuilder({ data: normalLogs, error: null });
    const alerts = await detectSuspiciousActivity('org1');
    expect(alerts.length).toBe(0);
  });
});
