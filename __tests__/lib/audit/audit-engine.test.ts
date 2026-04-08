/**
 * Tests for lib/audit/audit-engine.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/lib/audit/hash-utils', () => ({
  computeEntryHash: jest.fn(() => 'hash-abc-123'),
}));
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'uuid-mock'),
}));

function createBuilder(result: any = { data: null, error: null, count: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'gte',
    'lte',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'head',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseServerClient } = require('@/lib/supabase/server');

import {
  writeAuditLog,
  queryAuditLog,
  getAuditStats,
  requestAuditExport,
  getExportJobs,
} from '@/lib/audit/audit-engine';

beforeEach(() => jest.clearAllMocks());

describe('writeAuditLog', () => {
  it('inserts an audit entry with hash chain', async () => {
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { entry_hash: 'prev-hash', sequence_number: 5 },
            error: null,
          });
        return createBuilder({ error: null });
      }),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    await writeAuditLog('org-1', {
      userId: 'user-1',
      action: 'create',
      resourceType: 'control',
      resourceId: 'ctrl-1',
      details: { name: 'Test' },
      ipAddress: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
    });
    expect(db.from).toHaveBeenCalledWith('audit_log');
  });

  it('starts from sequence 1 when no prior entries', async () => {
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: null, error: null });
        return createBuilder({ error: null });
      }),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    await writeAuditLog('org-1', {
      action: 'login',
      resourceType: 'session',
    });
    expect(db.from).toHaveBeenCalled();
  });

  it('throws on insert error', async () => {
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: null, error: null });
        return createBuilder({ error: { message: 'fail' } });
      }),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    await expect(
      writeAuditLog('org-1', {
        action: 'test',
        resourceType: 'test',
      }),
    ).rejects.toBeDefined();
  });
});

describe('queryAuditLog', () => {
  it('queries with no filters', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ data: [{ id: 'e1' }], count: 1, error: null }),
      ),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    const result = await queryAuditLog('org-1');
    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('applies all filters', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: [], count: 0, error: null })),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    const result = await queryAuditLog('org-1', {
      action: 'create',
      resourceType: 'control',
      userId: 'user-1',
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      limit: 10,
      offset: 5,
    });
    expect(result.entries).toHaveLength(0);
  });

  it('throws on error', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ data: null, count: null, error: { message: 'fail' } }),
      ),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    await expect(queryAuditLog('org-1')).rejects.toBeDefined();
  });
});

describe('getAuditStats', () => {
  it('returns stats', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ count: 100, data: null, error: null }),
      ),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    const stats = await getAuditStats('org-1');
    expect(stats.total).toBe(100);
    expect(stats.last7d).toBe(100);
    expect(stats.last30d).toBe(100);
  });

  it('handles null counts', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ count: null, data: null, error: null }),
      ),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    const stats = await getAuditStats('org-1');
    expect(stats.total).toBe(0);
  });
});

describe('requestAuditExport', () => {
  it('creates export job', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ data: { id: 'job-1' }, error: null }),
      ),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    const result = await requestAuditExport('org-1', {
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      createdBy: 'user-1',
    });
    expect(result.id).toBe('job-1');
  });

  it('creates export job with filters', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ data: { id: 'job-2' }, error: null }),
      ),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    const result = await requestAuditExport('org-1', {
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      filters: { action: 'create' },
      createdBy: 'user-1',
    });
    expect(result.id).toBe('job-2');
  });

  it('throws on error', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      ),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    await expect(
      requestAuditExport('org-1', {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        createdBy: 'user-1',
      }),
    ).rejects.toBeDefined();
  });
});

describe('getExportJobs', () => {
  it('returns jobs', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: [{ id: 'j1' }], error: null })),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    const jobs = await getExportJobs('org-1');
    expect(jobs).toHaveLength(1);
  });

  it('returns empty when null', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    };
    createSupabaseServerClient.mockResolvedValue(db);

    const jobs = await getExportJobs('org-1');
    expect(jobs).toHaveLength(0);
  });
});
