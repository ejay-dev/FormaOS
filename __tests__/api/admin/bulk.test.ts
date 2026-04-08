/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/admin/bulk/route.ts
 */

jest.mock('server-only', () => ({}));

const mockRequireAdminAccess = jest.fn();
jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockLogAdminAction = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/admin/audit', () => ({
  logAdminAction: (...args: any[]) => mockLogAdminAction(...args),
}));

const mockCsrf = jest.fn(() => null);
jest.mock('@/lib/security/csrf', () => ({
  validateCsrfOrigin: (...args: any[]) => mockCsrf(...args),
}));

jest.mock('@/lib/ratelimit', () => ({
  checkAdminRateLimit: jest.fn().mockResolvedValue({ success: true }),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

const mockParsePayload = jest.fn();
const mockRequireChangeControl = jest.fn();
const mockExtractReason = jest.fn();
jest.mock('@/app/api/admin/_helpers', () => ({
  handleAdminError: jest.fn((err: any) =>
    Response.json({ error: err?.message ?? String(err) }, { status: 500 }),
  ),
  parseAdminMutationPayload: (...args: any[]) => mockParsePayload(...args),
  requireAdminChangeControl: (...args: any[]) =>
    mockRequireChangeControl(...args),
  extractAdminReason: (...args: any[]) => mockExtractReason(...args),
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

import { POST } from '@/app/api/admin/bulk/route';

describe('POST /api/admin/bulk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue({ user: { id: 'admin-1' } });
    mockExtractReason.mockReturnValue('test reason');
    mockRequireChangeControl.mockResolvedValue('approved reason');
  });

  it('returns CSRF error when origin invalid', async () => {
    mockCsrf.mockReturnValueOnce(new Response('CSRF', { status: 403 }));
    const req = new Request('http://localhost/api/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 for unsupported action', async () => {
    mockParsePayload.mockResolvedValue({
      payload: { action: 'invalid_action', orgIds: ['org-1'], dryRun: true },
    });

    const req = new Request('http://localhost/api/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty orgIds', async () => {
    mockParsePayload.mockResolvedValue({
      payload: { action: 'suspend', orgIds: [], dryRun: true },
    });

    const req = new Request('http://localhost/api/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('runs dry-run for suspend action', async () => {
    mockParsePayload.mockResolvedValue({
      payload: { action: 'suspend', orgIds: ['org-1', 'org-2'], dryRun: true },
    });
    tableBuilders['organizations'] = createBuilder({
      data: [
        {
          id: 'org-1',
          name: 'Acme',
          plan_key: 'pro',
          lifecycle_status: 'active',
          is_active: true,
        },
        {
          id: 'org-2',
          name: 'Beta',
          plan_key: 'basic',
          lifecycle_status: 'active',
          is_active: true,
        },
      ],
      error: null,
    });

    const req = new Request('http://localhost/api/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.dryRun).toBe(true);
  });

  it('executes restore action', async () => {
    mockParsePayload.mockResolvedValue({
      payload: { action: 'restore', orgIds: ['org-1'], dryRun: false },
    });
    tableBuilders['organizations'] = createBuilder({
      data: [
        {
          id: 'org-1',
          name: 'Acme',
          plan_key: 'pro',
          lifecycle_status: 'suspended',
          is_active: false,
        },
      ],
      error: null,
    });

    const req = new Request('http://localhost/api/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('executes cancel_trials action', async () => {
    mockParsePayload.mockResolvedValue({
      payload: { action: 'cancel_trials', orgIds: ['org-1'], dryRun: false },
    });
    tableBuilders['organizations'] = createBuilder({
      data: [
        {
          id: 'org-1',
          name: 'Acme',
          plan_key: 'trial',
          lifecycle_status: 'active',
          is_active: true,
        },
      ],
      error: null,
    });

    const req = new Request('http://localhost/api/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('executes tag action', async () => {
    mockParsePayload.mockResolvedValue({
      payload: {
        action: 'tag',
        orgIds: ['org-1'],
        dryRun: false,
        tag: 'premium',
      },
    });
    tableBuilders['organizations'] = createBuilder({
      data: [
        {
          id: 'org-1',
          name: 'Acme',
          plan_key: 'pro',
          lifecycle_status: 'active',
          is_active: true,
        },
      ],
      error: null,
    });

    const req = new Request('http://localhost/api/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('handles null orgIds', async () => {
    mockParsePayload.mockResolvedValue({
      payload: { action: 'suspend', orgIds: null, dryRun: true },
    });

    const req = new Request('http://localhost/api/admin/bulk', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
