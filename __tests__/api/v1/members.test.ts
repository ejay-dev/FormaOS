/** @jest-environment node */
/**
 * Branch-coverage tests for app/api/v1/members/route.ts
 * Targets 49 uncovered branches
 */

jest.mock('@/lib/api-keys/middleware', () => ({
  authenticateV1Request: jest.fn(),
  jsonWithContext: jest.fn(
    (_ctx: any, body: any, opts?: any) =>
      new Response(JSON.stringify(body), { status: opts?.status ?? 200 }),
  ),
  createEnvelope: jest.fn((d: any) => d),
  logV1Access: jest.fn(),
}));

jest.mock('@/lib/api/v1', () => ({
  getPagination: jest.fn((_req: any, defaultLimit: number) => ({
    limit: defaultLimit,
    offset: 0,
    searchParams: new URLSearchParams(),
  })),
  paginatedEnvelope: jest.fn((data: any, meta: any) => ({ data, meta })),
}));

jest.mock('@/lib/api/v1-helpers', () => ({
  getActorId: jest.fn(() => 'actor-1'),
  createInvitationToken: jest.fn(() => 'token-abc'),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/lib/audit-trail', () => ({ logActivity: jest.fn() }));
jest.mock('@/lib/webhooks/delivery-queue', () => ({
  queueWebhookDelivery: jest.fn(),
}));
jest.mock('@/lib/integrations/manager', () => ({
  dispatchIntegrationEvent: jest.fn(),
}));
jest.mock('@/lib/email/send-auth-email', () => ({
  sendAuthEmail: jest.fn(async () => ({ success: true, id: 'email-1' })),
}));

import { GET, POST } from '@/app/api/v1/members/route';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { getPagination } from '@/lib/api/v1';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendAuthEmail } from '@/lib/email/send-auth-email';

const mockAuth = authenticateV1Request as jest.Mock;
const mockPagination = getPagination as jest.Mock;
const mockAdmin = createSupabaseAdminClient as jest.Mock;
const mockEmail = sendAuthEmail as jest.Mock;

function builder(data: any = null, count: any = null, error: any = null) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: any) => resolve({ data, count, error });
  return b;
}

function makeContext(overrides: any = {}) {
  const b = builder([{ id: 'm1', role: 'admin', user_id: 'u1' }], 1);
  return {
    db: { from: jest.fn(() => b) },
    orgId: 'org-1',
    accessType: 'api_key',
    supabase: {
      auth: {
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    },
    ...overrides,
  };
}

describe('v1/members route', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------- GET -------
  it('GET returns auth error when not ok', async () => {
    mockAuth.mockResolvedValue({
      ok: false,
      response: new Response('Unauthorized', { status: 401 }),
    });
    const res = await GET(new Request('http://localhost/api/v1/members'));
    expect(res.status).toBe(401);
  });

  it('GET returns members with default pagination', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });
    mockPagination.mockReturnValue({
      limit: 25,
      offset: 0,
      searchParams: new URLSearchParams(),
    });
    const res = await GET(new Request('http://localhost/api/v1/members'));
    expect(res.status).toBe(200);
  });

  it('GET filters by role', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });
    mockPagination.mockReturnValue({
      limit: 25,
      offset: 0,
      searchParams: new URLSearchParams('role=admin'),
    });
    await GET(new Request('http://localhost/api/v1/members?role=admin'));
    expect(ctx.db.from).toHaveBeenCalledWith('org_members');
  });

  it('GET includes invitations when status not set', async () => {
    const invB = builder([
      { id: 'inv1', email: 'a@b.com', role: 'member', status: 'pending' },
    ]);
    const memB = builder([{ id: 'm1' }], 1);
    const fromFn = jest.fn((table: string) =>
      table === 'org_members' ? memB : invB,
    );
    const ctx = makeContext({ db: { from: fromFn } });
    mockAuth.mockResolvedValue({ ok: true, context: ctx });
    mockPagination.mockReturnValue({
      limit: 25,
      offset: 0,
      searchParams: new URLSearchParams(),
    });
    await GET(new Request('http://localhost/api/v1/members'));
    expect(fromFn).toHaveBeenCalledWith('team_invitations');
  });

  it('GET skips invitations when status=active', async () => {
    const memB = builder([{ id: 'm1' }], 1);
    const fromFn = jest.fn(() => memB);
    const ctx = makeContext({ db: { from: fromFn } });
    mockAuth.mockResolvedValue({ ok: true, context: ctx });
    mockPagination.mockReturnValue({
      limit: 25,
      offset: 0,
      searchParams: new URLSearchParams('status=active'),
    });
    await GET(new Request('http://localhost/api/v1/members?status=active'));
    // Should only query org_members, not team_invitations
    expect(fromFn).toHaveBeenCalledTimes(1);
  });

  // ------- POST -------
  it('POST returns auth error when not ok', async () => {
    mockAuth.mockResolvedValue({
      ok: false,
      response: new Response('Forbidden', { status: 403 }),
    });
    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        body: '{}',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST rejects missing email', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });
    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'member' }),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('email');
  });

  it('POST rejects invalid email (no @)', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });
    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'notanemail' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST rejects invalid role', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });
    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', role: 'superadmin' }),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('role');
  });

  it('POST creates invitation successfully', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });

    const invBuilder = builder({
      id: 'inv-1',
      email: 'test@example.com',
      role: 'member',
      status: 'pending',
      expires_at: '2025-01-01',
      created_at: '2024-12-25',
    });
    const orgBuilder = builder({ name: 'Acme Corp' });
    const adminFrom = jest.fn((table: string) =>
      table === 'team_invitations'
        ? invBuilder
        : table === 'organizations'
          ? orgBuilder
          : builder(),
    );
    mockAdmin.mockReturnValue({ from: adminFrom });

    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'Test@Example.com', role: 'member' }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it('POST handles insert error (500)', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });

    const invBuilder = builder(null, null, { message: 'DB error' });
    mockAdmin.mockReturnValue({ from: jest.fn(() => invBuilder) });

    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'fail@example.com', role: 'admin' }),
      }),
    );
    expect(res.status).toBe(500);
  });

  it('POST email delivery failure returns manual_share_required', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });

    const invBuilder = builder({
      id: 'inv-2',
      email: 'x@y.com',
      role: 'viewer',
      status: 'pending',
      expires_at: '2025-01-01',
      created_at: '2024-12-25',
    });
    const orgBuilder = builder({ name: 'Org' });
    const adminFrom = jest.fn((table: string) =>
      table === 'team_invitations'
        ? invBuilder
        : table === 'organizations'
          ? orgBuilder
          : builder(),
    );
    mockAdmin.mockReturnValue({ from: adminFrom });
    mockEmail.mockResolvedValue({ success: false, error: 'smtp_error' });

    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'x@y.com' }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it('POST with session accessType resolves inviter name from user', async () => {
    const ctx = makeContext({
      accessType: 'session',
      supabase: {
        auth: {
          getUser: jest.fn(async () => ({
            data: {
              user: {
                user_metadata: { full_name: 'Jane Doe' },
                email: 'jane@test.com',
              },
            },
            error: null,
          })),
        },
      },
    });
    mockAuth.mockResolvedValue({ ok: true, context: ctx });

    const invBuilder = builder({
      id: 'inv-3',
      email: 'z@w.com',
      role: 'member',
      status: 'pending',
      expires_at: '2025-01-01',
      created_at: '2024-12-25',
    });
    const orgBuilder = builder({ name: 'Org' });
    const adminFrom = jest.fn((table: string) =>
      table === 'team_invitations'
        ? invBuilder
        : table === 'organizations'
          ? orgBuilder
          : builder(),
    );
    mockAdmin.mockReturnValue({ from: adminFrom });

    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'z@w.com' }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it('POST handles null body gracefully', async () => {
    const ctx = makeContext();
    mockAuth.mockResolvedValue({ ok: true, context: ctx });
    const res = await POST(
      new Request('http://localhost/api/v1/members', {
        method: 'POST',
        body: 'not json',
      }),
    );
    expect(res.status).toBe(400);
  });
});
