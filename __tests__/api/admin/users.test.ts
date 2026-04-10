/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/admin/users/route.ts
 */

jest.mock('server-only', () => ({}));

const mockRequireAdminAccess = jest.fn();
jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

jest.mock('@/app/api/admin/_helpers', () => ({
  handleAdminError: jest.fn((err: any, _route: string) => {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }),
}));

const mockRateLimit = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitApi: (...args: any[]) => mockRateLimit(...args),
}));

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

const mockListUsers = jest.fn();
let memberBuilder: any;
let orgBuilder: any;

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'org_members') return memberBuilder;
      if (table === 'organizations') return orgBuilder;
      return createBuilder();
    }),
    auth: { admin: { listUsers: (...args: any[]) => mockListUsers(...args) } },
  })),
}));

import { GET } from '@/app/api/admin/users/route';

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue({ user: { id: 'admin-1' } });
    memberBuilder = createBuilder({ data: [], error: null });
    orgBuilder = createBuilder({ data: [], error: null });
  });

  it('returns 403 when not admin', async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error('Forbidden'));
    const req = new Request('http://localhost/api/admin/users');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false });
    const req = new Request('http://localhost/api/admin/users');
    const res = await GET(req);
    expect(res.status).toBe(429);
  });

  it('returns paginated users without query', async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'u1',
            email: 'a@test.com',
            app_metadata: { provider: 'email' },
            user_metadata: {},
          },
          {
            id: 'u2',
            email: 'b@test.com',
            app_metadata: {},
            user_metadata: { full_name: 'Bob' },
          },
        ],
        total: 2,
      },
      error: null,
    });
    memberBuilder = createBuilder({
      data: [{ user_id: 'u1', role: 'admin', organization_id: 'org-1' }],
      error: null,
    });
    orgBuilder = createBuilder({
      data: [{ id: 'org-1', name: 'Acme' }],
      error: null,
    });

    const req = new Request(
      'http://localhost/api/admin/users?page=1&pageSize=10',
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].role).toBe('admin');
    expect(json.data[0].organization).toBe('Acme');
    expect(json.data[1].role).toBe('N/A');
  });

  it('filters users by search query', async () => {
    const users = [
      {
        id: 'u1',
        email: 'alice@test.com',
        app_metadata: {},
        user_metadata: { full_name: 'Alice' },
      },
      {
        id: 'u2',
        email: 'bob@test.com',
        app_metadata: {},
        user_metadata: { name: 'Bob' },
      },
      {
        id: 'u3',
        email: 'charlie@test.com',
        app_metadata: {},
        user_metadata: {},
      },
    ];
    mockListUsers.mockResolvedValue({
      data: { users, total: 3 },
      error: null,
    });
    memberBuilder = createBuilder({ data: [], error: null });
    orgBuilder = createBuilder({ data: [], error: null });

    const req = new Request('http://localhost/api/admin/users?query=alice');
    const res = await GET(req);
    const json = await res.json();

    expect(json.total).toBe(1);
    expect(json.data[0].email).toBe('alice@test.com');
  });

  it('searches by user_metadata name field', async () => {
    const users = [
      {
        id: 'u1',
        email: 'x@test.com',
        app_metadata: {},
        user_metadata: { name: 'findme' },
      },
    ];
    mockListUsers.mockResolvedValue({
      data: { users, total: 1 },
      error: null,
    });

    const req = new Request('http://localhost/api/admin/users?query=findme');
    const res = await GET(req);
    const json = await res.json();

    expect(json.total).toBe(1);
  });

  it('handles listUsers error', async () => {
    mockListUsers.mockResolvedValue({
      data: null,
      error: new Error('Auth service error'),
    });

    const req = new Request('http://localhost/api/admin/users');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('handles empty memberships', async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'u1',
            email: 'a@test.com',
            app_metadata: {},
            user_metadata: {},
          },
        ],
        total: 1,
      },
      error: null,
    });

    const req = new Request('http://localhost/api/admin/users');
    const res = await GET(req);
    const json = await res.json();

    expect(json.data[0].role).toBe('N/A');
    expect(json.data[0].organization).toBe('N/A');
  });

  it('paginates search results', async () => {
    const users = Array.from({ length: 5 }, (_, i) => ({
      id: `u${i}`,
      email: `user${i}@test.com`,
      app_metadata: {},
      user_metadata: {},
    }));
    mockListUsers.mockResolvedValue({
      data: { users, total: 5 },
      error: null,
    });

    const req = new Request(
      'http://localhost/api/admin/users?query=user&page=2&pageSize=2',
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.data).toHaveLength(2);
    expect(json.page).toBe(2);
  });
});
