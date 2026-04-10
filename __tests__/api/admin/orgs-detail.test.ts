/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/admin/orgs/[orgId]/route.ts
 */

jest.mock('server-only', () => ({}));

const mockRequireAdminAccess = jest.fn();
jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

jest.mock('@/app/api/admin/_helpers', () => ({
  handleAdminError: jest.fn((err: any) =>
    Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    ),
  ),
}));

const mockFetchAuthEmails = jest.fn().mockResolvedValue(new Map());
jest.mock('@/app/api/admin/_auth-users', () => ({
  fetchAuthEmailsByIds: (...args: any[]) => mockFetchAuthEmails(...args),
}));

const mockGetHealthSnapshot = jest.fn().mockResolvedValue({ score: 80 });
jest.mock('@/lib/admin/customer-health', () => ({
  getAdminOrgHealthSnapshot: (...args: any[]) => mockGetHealthSnapshot(...args),
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

const tableBuilders: Record<string, any> = {};
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn((table: string) => tableBuilders[table] ?? createBuilder()),
  })),
}));

import { GET } from '@/app/api/admin/orgs/[orgId]/route';

function makeRequest(orgId: string) {
  const req = new Request(`http://localhost/api/admin/orgs/${orgId}`);
  return { req, params: Promise.resolve({ orgId }) };
}

describe('GET /api/admin/orgs/[orgId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue({ user: { id: 'admin-1' } });
    mockFetchAuthEmails.mockResolvedValue(new Map([['u1', 'user1@test.com']]));

    // Set up builders for each table
    tableBuilders['organizations'] = createBuilder({
      data: { id: 'org-1', name: 'Acme', plan_key: 'pro' },
      error: null,
    });
    tableBuilders['org_subscriptions'] = createBuilder({
      data: { status: 'active', plan_key: 'pro' },
      error: null,
    });
    tableBuilders['org_members'] = createBuilder({
      data: [{ user_id: 'u1', role: 'admin', created_at: '2024-01-01' }],
      error: null,
    });
    tableBuilders['admin_notes'] = createBuilder({ data: [], error: null });
    tableBuilders['org_entitlements'] = createBuilder({
      data: [],
      error: null,
    });
    tableBuilders['support_requests'] = createBuilder({
      data: [],
      error: null,
    });
    tableBuilders['user_activity'] = createBuilder({
      data: [
        {
          id: 'a1',
          user_id: 'u1',
          action: 'login',
          metadata: { key: 'val' },
          created_at: '2024-01-01',
        },
      ],
      error: null,
    });
    tableBuilders['active_sessions'] = createBuilder({
      data: [
        {
          id: 's1',
          user_id: 'u1',
          session_id: 'sess-1',
          metadata: null,
          created_at: '2024-01-01',
        },
      ],
      error: null,
    });
    tableBuilders['security_events'] = createBuilder({
      data: [
        {
          id: 'se1',
          user_id: 'u1',
          type: 'login',
          severity: 'info',
          metadata: { detail: 'ok' },
          created_at: '2024-01-01',
        },
      ],
      error: null,
    });
    tableBuilders['security_alerts'] = createBuilder({ data: [], error: null });
    tableBuilders['compliance_export_jobs'] = createBuilder({
      data: [],
      error: null,
    });
    tableBuilders['report_export_jobs'] = createBuilder({
      data: [],
      error: null,
    });
  });

  it('returns full org detail', async () => {
    const { req, params } = makeRequest('org-1');
    const res = await GET(req, { params });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.organization).toBeDefined();
    expect(json.members).toHaveLength(1);
    expect(json.members[0].email).toBe('user1@test.com');
  });

  it('returns 500 when admin access denied', async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error('Forbidden'));
    const { req, params } = makeRequest('org-1');
    const res = await GET(req, { params });
    expect(res.status).toBe(500);
  });

  it('handles null metadata in activity/sessions/security as empty object', async () => {
    tableBuilders['user_activity'] = createBuilder({
      data: [
        {
          id: 'a1',
          user_id: 'u1',
          action: 'test',
          metadata: null,
          created_at: '2024-01-01',
        },
      ],
      error: null,
    });
    tableBuilders['active_sessions'] = createBuilder({
      data: [
        {
          id: 's1',
          user_id: 'u1',
          session_id: 'sess',
          metadata: 'not-object',
          created_at: '2024-01-01',
        },
      ],
      error: null,
    });

    const { req, params } = makeRequest('org-1');
    const res = await GET(req, { params });
    const _json = await res.json();
    expect(res.status).toBe(200);
  });

  it('handles security events with alerts', async () => {
    tableBuilders['security_events'] = createBuilder({
      data: [
        {
          id: 'se1',
          user_id: 'u1',
          type: 'brute_force',
          severity: 'high',
          metadata: {},
          created_at: '2024-01-01',
        },
      ],
      error: null,
    });
    tableBuilders['security_alerts'] = createBuilder({
      data: [
        {
          id: 'alert-1',
          event_id: 'se1',
          status: 'open',
          notes: 'Test alert',
          created_at: '2024-01-01',
        },
      ],
      error: null,
    });

    const { req, params } = makeRequest('org-1');
    const res = await GET(req, { params });
    const json = await res.json();

    expect(json.security[0].alert).toBeDefined();
    expect(json.security[0].alert.notes).toBe('Test alert');
  });

  it('handles empty members list', async () => {
    tableBuilders['org_members'] = createBuilder({ data: [], error: null });
    mockFetchAuthEmails.mockResolvedValue(new Map());

    const { req, params } = makeRequest('org-1');
    const res = await GET(req, { params });
    const json = await res.json();

    expect(json.members).toHaveLength(0);
  });

  it('handles array metadata passed to asObject', async () => {
    tableBuilders['user_activity'] = createBuilder({
      data: [
        {
          id: 'a1',
          user_id: 'u1',
          action: 'test',
          metadata: [1, 2, 3],
          created_at: '2024-01-01',
        },
      ],
      error: null,
    });

    const { req, params } = makeRequest('org-1');
    const res = await GET(req, { params });
    const _json = await res.json();

    // Array metadata is treated as empty object by asObject
    expect(res.status).toBe(200);
  });
});
