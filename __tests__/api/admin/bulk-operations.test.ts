/** @jest-environment node */
/**
 * Approval-gate contract for app/api/admin/bulk-operations/route.ts.
 * Added 2026-05-27: the route previously skipped requireAdminChangeControl
 * entirely, allowing mass-suspend of up to 100 orgs without four-eye review.
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

import { POST } from '@/app/api/admin/bulk-operations/route';

describe('POST /api/admin/bulk-operations (approval-gate contract)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue({ user: { id: 'admin-1' } });
    mockExtractReason.mockReturnValue('legit reason text');
    mockRequireChangeControl.mockResolvedValue('approved reason text');
    Object.keys(tableBuilders).forEach((k) => delete tableBuilders[k]);
    tableBuilders['organizations'] = createBuilder({
      data: [
        { id: 'org-1', name: 'Acme', lifecycle_status: 'active' },
        { id: 'org-2', name: 'Beta', lifecycle_status: 'active' },
      ],
      error: null,
    });
  });

  it('blocks on CSRF failure', async () => {
    mockCsrf.mockReturnValueOnce(new Response('CSRF', { status: 403 }));
    const req = new Request('http://localhost/api/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockRequireChangeControl).not.toHaveBeenCalled();
  });

  it('returns 400 for unsupported operation', async () => {
    mockParsePayload.mockResolvedValue({
      payload: { operation: 'detonate', targets: [{ orgId: 'org-1' }], dryRun: true },
    });
    const req = new Request('http://localhost/api/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty targets', async () => {
    mockParsePayload.mockResolvedValue({
      payload: { operation: 'suspend_orgs', targets: [], dryRun: true },
    });
    const req = new Request('http://localhost/api/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('does NOT invoke approval gate for dry-run', async () => {
    mockParsePayload.mockResolvedValue({
      payload: {
        operation: 'suspend_orgs',
        targets: [{ orgId: 'org-1' }, { orgId: 'org-2' }],
        dryRun: true,
      },
    });
    const req = new Request('http://localhost/api/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockRequireChangeControl).not.toHaveBeenCalled();
  });

  it('REQUIRES APPROVAL for non-dry-run suspend_orgs', async () => {
    mockParsePayload.mockResolvedValue({
      payload: {
        operation: 'suspend_orgs',
        targets: [{ orgId: 'org-1' }, { orgId: 'org-2' }],
        dryRun: false,
      },
    });
    const req = new Request('http://localhost/api/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockRequireChangeControl).toHaveBeenCalledTimes(1);
    expect(mockRequireChangeControl).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'bulk_suspend_orgs',
        targetType: 'bulk_operation',
        targetId: '2_orgs',
        requireApproval: true,
      }),
    );
  });

  it('runs change-control gate (without approval) for extend_trials', async () => {
    mockParsePayload.mockResolvedValue({
      payload: {
        operation: 'extend_trials',
        targets: [{ orgId: 'org-1' }],
        dryRun: false,
        params: { days: 14 },
      },
    });
    const req = new Request('http://localhost/api/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockRequireChangeControl).toHaveBeenCalledTimes(1);
    expect(mockRequireChangeControl).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'bulk_extend_trials',
        requireApproval: false,
      }),
    );
  });

  it('runs change-control gate (without approval) for recalculate_health', async () => {
    mockParsePayload.mockResolvedValue({
      payload: {
        operation: 'recalculate_health',
        targets: [{ orgId: 'org-1' }],
        dryRun: false,
      },
    });
    const req = new Request('http://localhost/api/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockRequireChangeControl).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'bulk_recalculate_health',
        requireApproval: false,
      }),
    );
  });

  it('propagates approval rejection (4xx from requireAdminChangeControl)', async () => {
    mockRequireChangeControl.mockRejectedValueOnce(
      new Error('Approval required: this admin change has not been approved'),
    );
    mockParsePayload.mockResolvedValue({
      payload: {
        operation: 'suspend_orgs',
        targets: [{ orgId: 'org-1' }],
        dryRun: false,
      },
    });
    const req = new Request('http://localhost/api/admin/bulk-operations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
