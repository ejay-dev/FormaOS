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
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('logIdentityEvent', () => {
  it('inserts event and audit log', async () => {
    const builder = createBuilder({ data: null, error: null });
    __admin.from = jest.fn(() => builder);
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
    expect(builder.insert).toHaveBeenCalledWith({
      // org_id is stamped by the org-scoped client wrapper.
      org_id: 'org-1',
      event_type: 'sso.login',
      actor_type: 'user',
      actor_id: 'user-1',
      actor_label: 'test@example.com',
      target_user_id: 'target-1',
      target_user_email: 'target@example.com',
      ip_address: '1.2.3.4',
      user_agent: 'Mozilla/5.0',
      result: 'success',
      metadata: { provider: 'google' },
    });
    expect(insertOrgAuditLog).toHaveBeenCalledWith(
      __admin,
      expect.objectContaining({
        organization_id: 'org-1',
        action: 'sso.login',
        domain: 'security',
        severity: 'low',
      }),
    );
  });

  it('escalates severity to high on a failed identity event', async () => {
    __admin.from = jest.fn(() => createBuilder({ data: null, error: null }));
    await logIdentityEvent({
      eventType: 'sso.login',
      actorType: 'user',
      orgId: 'org-1',
      result: 'failure',
      actorLabel: 'attacker@example.com',
    });
    expect(insertOrgAuditLog).toHaveBeenCalledWith(
      __admin,
      expect.objectContaining({ severity: 'high' }),
    );
  });

  it('handles minimal input (no optional fields)', async () => {
    const builder = createBuilder({ data: null, error: null });
    __admin.from = jest.fn(() => builder);
    await logIdentityEvent({
      eventType: 'scim.user.create',
      actorType: 'system',
      orgId: 'org-1',
      result: 'failure',
    });
    expect(builder.insert).toHaveBeenCalledWith({
      org_id: 'org-1',
      event_type: 'scim.user.create',
      actor_type: 'system',
      actor_id: null,
      actor_label: null,
      target_user_id: null,
      target_user_email: null,
      ip_address: null,
      user_agent: null,
      result: 'failure',
      metadata: {},
    });
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
    const builder = createBuilder({ data: [], count: 0, error: null });
    __admin.from = jest.fn(() => builder);
    await queryIdentityEvents({ orgId: 'org-1', limit: 500 });
    // limit = min(200, max(1, 500)) -> range(offset, offset + limit - 1).
    // Losing the clamp lets one request drain the whole identity audit log.
    expect(builder.range).toHaveBeenCalledWith(0, 199);
  });

  it('floors limit at 1 and offset at 0', async () => {
    const builder = createBuilder({ data: [], count: 0, error: null });
    __admin.from = jest.fn(() => builder);
    await queryIdentityEvents({ orgId: 'org-1', limit: 0, offset: -50 });
    expect(builder.range).toHaveBeenCalledWith(0, 0);
  });

  it('defaults to a 50-row page and honours the offset', async () => {
    const builder = createBuilder({ data: [], count: 0, error: null });
    __admin.from = jest.fn(() => builder);
    await queryIdentityEvents({ orgId: 'org-1', offset: 100 });
    expect(builder.range).toHaveBeenCalledWith(100, 149);
  });

  it('scopes the query to the caller org and orders newest first', async () => {
    const builder = createBuilder({ data: [], count: 0, error: null });
    __admin.from = jest.fn(() => builder);
    await queryIdentityEvents({ orgId: 'org-1' });
    // identity_audit_events carries the tenant on org_id (see
    // TENANT_TABLE_SCOPES in lib/supabase/org-scoped.ts).
    expect(builder.eq).toHaveBeenCalledWith('org_id', 'org-1');
    expect(builder.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
  });

  it('applies every supplied filter to the query', async () => {
    const builder = createBuilder({ data: [], count: 0, error: null });
    __admin.from = jest.fn(() => builder);
    await queryIdentityEvents({
      orgId: 'org-1',
      eventTypes: ['sso.login'],
      actorId: 'user-1',
      actorLabel: 'test',
      targetUserId: 'target-1',
      targetUserEmail: 'target@example.com',
      result: 'success',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
    });
    expect(builder.in).toHaveBeenCalledWith('event_type', ['sso.login']);
    expect(builder.eq).toHaveBeenCalledWith('actor_id', 'user-1');
    expect(builder.ilike).toHaveBeenCalledWith('actor_label', '%test%');
    expect(builder.eq).toHaveBeenCalledWith('target_user_id', 'target-1');
    expect(builder.ilike).toHaveBeenCalledWith(
      'target_user_email',
      '%target@example.com%',
    );
    expect(builder.eq).toHaveBeenCalledWith('result', 'success');
    expect(builder.gte).toHaveBeenCalledWith('created_at', '2025-01-01');
    expect(builder.lte).toHaveBeenCalledWith('created_at', '2025-12-31');
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
