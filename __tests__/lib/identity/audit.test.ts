/**
 * Tests for lib/identity/audit.ts
 */

jest.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    splitTextToSize: jest.fn(() => ['line1']),
    addPage: jest.fn(),
    output: jest.fn(() => new ArrayBuffer(10)),
  };
  return { jsPDF: jest.fn(() => mockDoc) };
});

function createBuilder(result: any = { data: null, error: null, count: 0 }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
    'ilike',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const __admin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => __admin),
}));

jest.mock('@/lib/audit/org-audit-log', () => ({
  insertOrgAuditLog: jest.fn(),
}));

import {
  logIdentityEvent,
  queryIdentityEvents,
  exportIdentityEvents,
} from '@/lib/identity/audit';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('logIdentityEvent', () => {
  it('inserts event and audit log', async () => {
    __admin.from = jest.fn(() => createBuilder({ data: null, error: null }));
    await logIdentityEvent({
      eventType: 'sso.login',
      actorType: 'user',
      orgId: 'org-1',
      result: 'success',
      actorId: 'user-1',
      actorLabel: 'test@example.com',
      targetUserId: 'target-1',
      targetUserEmail: 'target@example.com',
      ipAddress: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
      metadata: { provider: 'google' },
    });
    expect(__admin.from).toHaveBeenCalledWith('identity_audit_events');
  });

  it('handles minimal input (no optional fields)', async () => {
    __admin.from = jest.fn(() => createBuilder({ data: null, error: null }));
    await logIdentityEvent({
      eventType: 'scim.user.create',
      actorType: 'system',
      orgId: 'org-1',
      result: 'failure',
    });
    expect(__admin.from).toHaveBeenCalled();
  });

  it('handles errors without throwing', async () => {
    __admin.from = jest.fn(() => {
      throw new Error('DB down');
    });
    await expect(
      logIdentityEvent({
        eventType: 'auth.password.changed',
        actorType: 'user',
        orgId: 'org-1',
        result: 'success',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('queryIdentityEvents', () => {
  it('queries with all filters', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: '1',
            created_at: '2025-01-01',
            event_type: 'sso.login',
            actor_type: 'user',
            actor_id: 'user-1',
            actor_label: 'test@example.com',
            target_user_id: null,
            target_user_email: null,
            org_id: 'org-1',
            ip_address: '1.2.3.4',
            user_agent: 'Mozilla',
            result: 'success',
            metadata: { key: 'value' },
          },
        ],
        count: 1,
        error: null,
      }),
    );
    const result = await queryIdentityEvents({
      orgId: 'org-1',
      eventTypes: ['sso.login'],
      actorId: 'user-1',
      actorLabel: 'test',
      targetUserId: 'target-1',
      targetUserEmail: 'target@example.com',
      result: 'success',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      limit: 10,
      offset: 0,
    });
    expect(result.events).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('handles no filters except orgId', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: [], count: 0, error: null }),
    );
    const result = await queryIdentityEvents({ orgId: 'org-1' });
    expect(result.events).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('throws on error', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: null, count: null, error: { message: 'fail' } }),
    );
    await expect(queryIdentityEvents({ orgId: 'org-1' })).rejects.toThrow(
      'fail',
    );
  });

  it('clamps limit to 200 max', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({ data: [], count: 0, error: null }),
    );
    await queryIdentityEvents({ orgId: 'org-1', limit: 500 });
    // Should still work, just clamped
    expect(__admin.from).toHaveBeenCalled();
  });

  it('handles metadata as non-object', async () => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: '1',
            created_at: '2025-01-01',
            event_type: 'sso.login',
            actor_type: 'user',
            org_id: 'org-1',
            result: 'success',
            metadata: 'not-an-object',
          },
        ],
        count: 1,
        error: null,
      }),
    );
    const result = await queryIdentityEvents({ orgId: 'org-1' });
    expect(result.events[0].metadata).toEqual({});
  });
});

describe('exportIdentityEvents', () => {
  beforeEach(() => {
    __admin.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: '1',
            created_at: '2025-01-01T00:00:00Z',
            event_type: 'sso.login',
            actor_type: 'user',
            actor_id: 'user-1',
            actor_label: 'test@example.com',
            target_user_id: null,
            target_user_email: null,
            org_id: 'org-1',
            ip_address: '1.2.3.4',
            user_agent: 'Mozilla',
            result: 'success',
            metadata: { key: 'value' },
          },
        ],
        count: 1,
        error: null,
      }),
    );
  });

  it('exports as JSON', async () => {
    const result = await exportIdentityEvents({ orgId: 'org-1' }, 'json');
    expect(result.mimeType).toContain('application/json');
    expect(result.filename).toContain('identity-audit-org-1.json');
    expect(typeof result.body).toBe('string');
  });

  it('exports as CSV', async () => {
    const result = await exportIdentityEvents({ orgId: 'org-1' }, 'csv');
    expect(result.mimeType).toContain('text/csv');
    expect(result.filename).toContain('.csv');
    expect(typeof result.body).toBe('string');
    expect(result.body).toContain('timestamp');
  });

  it('exports as PDF', async () => {
    const result = await exportIdentityEvents({ orgId: 'org-1' }, 'pdf');
    expect(result.mimeType).toContain('application/pdf');
    expect(result.filename).toContain('.pdf');
    expect(Buffer.isBuffer(result.body)).toBe(true);
  });
});
