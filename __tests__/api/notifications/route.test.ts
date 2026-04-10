/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/notifications/route.ts
 * GET, PATCH, POST handlers
 */

jest.mock('server-only', () => ({}));

const _mockSelect = jest.fn();
const _mockEq = jest.fn();
const _mockIs = jest.fn();
const _mockIn = jest.fn();
const _mockLt = jest.fn();
const _mockOrder = jest.fn();
const _mockLimit = jest.fn();
const _mockUpdate = jest.fn();

function createBuilder(result: any = { data: null, error: null }) {
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
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let queryBuilder: any;
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn(() => queryBuilder),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  })),
}));

const mockNotify = jest.fn().mockResolvedValue({ sent: true });
jest.mock('@/lib/notifications/engine', () => ({
  notify: (...args: any[]) => mockNotify(...args),
}));

jest.mock('@/lib/notifications/types', () => ({
  EVENT_CATEGORY_MAP: {
    'system.release': 'system',
    'compliance.control_updated': 'compliance',
    'incident.escalated': 'incidents',
  },
  EVENT_LABELS: {
    'system.release': 'System Release',
    'compliance.control_updated': 'Compliance Update',
    'incident.escalated': 'Incident Escalation',
  },
  NOTIFICATION_EVENT_TYPES: [
    'system.release',
    'compliance.control_updated',
    'incident.escalated',
  ],
}));

jest.mock('@/lib/notifications/server', () => ({
  decodeCursor: jest.fn((val: string | null) => {
    if (!val) return null;
    return { createdAt: '2024-01-01T00:00:00Z' };
  }),
  encodeCursor: jest.fn((_item: any) => 'cursor-encoded'),
  requireNotificationContext: jest.fn(async (orgId: string | null) => ({
    supabase: { from: jest.fn(() => queryBuilder) },
    orgId: orgId ?? 'org-1',
    user: { id: 'user-1' },
  })),
}));

jest.mock('@/lib/security/csrf', () => ({
  validateCsrfOrigin: jest.fn(() => null),
}));

import { GET, PATCH, POST } from '@/app/api/notifications/route';

describe('GET /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated notifications', async () => {
    const items = [
      {
        id: 'n1',
        type: 'system.release',
        title: 'Test',
        created_at: '2024-01-02',
      },
      {
        id: 'n2',
        type: 'system.release',
        title: 'Test 2',
        created_at: '2024-01-01',
      },
    ];
    queryBuilder = createBuilder({ data: items, error: null });

    const req = new Request('http://localhost/api/notifications?orgId=org-1');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items).toHaveLength(2);
    expect(json.nextCursor).toBeNull();
  });

  it('returns hasMore when more than limit items', async () => {
    // Default limit is 25, so we need 26 items
    const items = Array.from({ length: 26 }, (_, i) => ({
      id: `n${i}`,
      type: 'system.release',
      title: `Test ${i}`,
      created_at: `2024-01-${String(i + 1).padStart(2, '0')}`,
    }));
    queryBuilder = createBuilder({ data: items, error: null });

    const req = new Request(
      'http://localhost/api/notifications?orgId=org-1&limit=25',
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.items).toHaveLength(25);
    expect(json.nextCursor).toBe('cursor-encoded');
  });

  it('filters unread only', async () => {
    queryBuilder = createBuilder({ data: [], error: null });
    const req = new Request(
      'http://localhost/api/notifications?orgId=org-1&unread=true',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('includes archived', async () => {
    queryBuilder = createBuilder({ data: [], error: null });
    const req = new Request(
      'http://localhost/api/notifications?orgId=org-1&archived=true',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('filters by category', async () => {
    queryBuilder = createBuilder({ data: [], error: null });
    const req = new Request(
      'http://localhost/api/notifications?orgId=org-1&category=system',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('accepts cursor parameter', async () => {
    queryBuilder = createBuilder({ data: [], error: null });
    const req = new Request(
      'http://localhost/api/notifications?orgId=org-1&cursor=abc',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('handles query error', async () => {
    queryBuilder = createBuilder({
      data: null,
      error: { message: 'DB error' },
    });
    // Override .then to throw
    queryBuilder.then = (_resolve: any, _reject: any) => {
      throw { message: 'DB error' };
    };
    const req = new Request('http://localhost/api/notifications?orgId=org-1');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('clamps limit to valid range', async () => {
    queryBuilder = createBuilder({ data: [], error: null });
    const req = new Request(
      'http://localhost/api/notifications?orgId=org-1&limit=999',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks notifications as read', async () => {
    queryBuilder = createBuilder({ data: [{ id: 'n1' }], error: null });
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        orgId: 'org-1',
        ids: ['n1'],
        action: 'mark_read',
      }),
    });
    const res = await PATCH(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.updated).toBe(1);
  });

  it('archives notifications', async () => {
    queryBuilder = createBuilder({
      data: [{ id: 'n1' }, { id: 'n2' }],
      error: null,
    });
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        orgId: 'org-1',
        ids: ['n1', 'n2'],
        action: 'archive',
      }),
    });
    const res = await PATCH(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.updated).toBe(2);
  });

  it('marks all as read', async () => {
    queryBuilder = createBuilder({ data: [{ id: 'n1' }], error: null });
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ orgId: 'org-1', action: 'mark_all_read' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('returns 400 when no action', async () => {
    queryBuilder = createBuilder({ data: null, error: null });
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ orgId: 'org-1', ids: ['n1'] }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when ids missing for non-mark_all_read', async () => {
    queryBuilder = createBuilder({ data: null, error: null });
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ orgId: 'org-1', action: 'mark_read' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('handles null body', async () => {
    queryBuilder = createBuilder({ data: null, error: null });
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: 'invalid json',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('handles query error', async () => {
    queryBuilder = createBuilder({ data: null, error: null });
    queryBuilder.then = () => {
      throw { message: 'fail' };
    };
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        orgId: 'org-1',
        ids: ['n1'],
        action: 'mark_read',
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends test notification with default event type', async () => {
    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockNotify).toHaveBeenCalled();
  });

  it('sends test notification with specific event type', async () => {
    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1', eventType: 'incident.escalated' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('sends with custom priority', async () => {
    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1', priority: 'critical' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('defaults invalid priority to normal', async () => {
    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1', priority: 'invalid-priority' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    // The priority arg should be 'normal'
    const callArgs = mockNotify.mock.calls[0];
    expect(callArgs[2].priority).toBe('normal');
  });

  it('defaults invalid event type to system.release', async () => {
    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1', eventType: 'unknown.type' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('handles notify error', async () => {
    mockNotify.mockRejectedValueOnce(new Error('Notify failed'));
    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns CSRF error when origin invalid', async () => {
    const { validateCsrfOrigin } = require('@/lib/security/csrf');
    validateCsrfOrigin.mockReturnValueOnce(
      new Response('CSRF', { status: 403 }),
    );
    const req = new Request('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
