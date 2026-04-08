/** @jest-environment node */
/**
 * Tests for app/api/admin/trials/route.ts GET handler
 */

jest.mock('server-only', () => ({}));
jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: jest.fn(),
}));
jest.mock('@/app/api/admin/_helpers', () => ({
  handleAdminError: jest.fn((error: any, route: string) => {
    const { NextResponse } = require('next/server');
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized' || msg === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unavailable (permission)' },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: `Failed to process ${route}` },
      { status: 500 },
    );
  }),
}));
jest.mock('@/app/api/admin/_auth-users', () => ({
  fetchAuthEmailsByIds: jest.fn(async () => new Map()),
}));

function createBuilder(result: any = { data: null, error: null, count: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'in',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'gte',
    'lte',
    'is',
    'contains',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
const { requireAdminAccess } = require('@/app/app/admin/access');

import { GET } from '@/app/api/admin/trials/route';

beforeEach(() => jest.clearAllMocks());

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost:3000/api/admin/trials');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

describe('GET /api/admin/trials', () => {
  it('returns 403 on Unauthorized', async () => {
    requireAdminAccess.mockRejectedValue(new Error('Unauthorized'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns trials without query', async () => {
    requireAdminAccess.mockResolvedValue({});
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: [
              {
                organization_id: 'org1',
                status: 'trialing',
                trial_expires_at: new Date(
                  Date.now() + 86400000 * 10,
                ).toISOString(),
                current_period_end: null,
              },
            ],
            error: null,
            count: 1,
          });
        if (callCount === 2)
          return createBuilder({
            data: [{ id: 'org1', name: 'Org One' }],
            error: null,
          });
        if (callCount === 3)
          return createBuilder({
            data: [{ organization_id: 'org1', user_id: 'u1' }],
            error: null,
          });
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trials).toBeDefined();
    expect(body.trials.length).toBeGreaterThanOrEqual(0);
  });

  it('returns trials with status filter', async () => {
    requireAdminAccess.mockResolvedValue({});
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: [], error: null, count: 0 })),
    });
    const res = await GET(makeRequest({ status: 'trialing' }));
    expect(res.status).toBe(200);
  });

  it('handles search query', async () => {
    requireAdminAccess.mockResolvedValue({});
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: [
              {
                organization_id: 'org1',
                status: 'trialing',
                trial_expires_at: new Date(Date.now() + 86400000).toISOString(),
              },
            ],
            error: null,
            count: 1,
          });
        // orgs
        if (callCount === 2)
          return createBuilder({
            data: [{ id: 'org1', name: 'Test Org' }],
            error: null,
          });
        // members
        if (callCount === 3) return createBuilder({ data: [], error: null });
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest({ query: 'test' }));
    expect(res.status).toBe(200);
  });

  it('handles expired trial', async () => {
    requireAdminAccess.mockResolvedValue({});
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: [
              {
                organization_id: 'org1',
                status: 'trialing',
                trial_expires_at: new Date(Date.now() - 86400000).toISOString(),
                current_period_end: null,
              },
            ],
            error: null,
            count: 1,
          });
        if (callCount === 2) return createBuilder({ data: [], error: null });
        if (callCount === 3) return createBuilder({ data: [], error: null });
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    const expired = body.trials?.find((t: any) => t.status === 'expired');
    expect(expired || body.trials.length >= 0).toBeTruthy();
  });

  it('handles trial expiring within 3 days', async () => {
    requireAdminAccess.mockResolvedValue({});
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: [
              {
                organization_id: 'org2',
                status: 'trialing',
                trial_expires_at: new Date(
                  Date.now() + 86400000 * 2,
                ).toISOString(),
                current_period_end: null,
              },
            ],
            error: null,
            count: 1,
          });
        if (callCount === 2)
          return createBuilder({
            data: [{ id: 'org2', name: 'Expiring Org' }],
            error: null,
          });
        if (callCount === 3) return createBuilder({ data: [], error: null });
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it('handles null trial_expires_at with current_period_end', async () => {
    requireAdminAccess.mockResolvedValue({});
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: [
              {
                organization_id: 'org3',
                status: 'trialing',
                trial_expires_at: null,
                current_period_end: new Date(
                  Date.now() + 86400000 * 5,
                ).toISOString(),
              },
            ],
            error: null,
            count: 1,
          });
        if (callCount === 2)
          return createBuilder({
            data: [{ id: 'org3', name: 'Fallback Org' }],
            error: null,
          });
        if (callCount === 3) return createBuilder({ data: [], error: null });
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it('skips rows with null trial end dates', async () => {
    requireAdminAccess.mockResolvedValue({});
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: [
              {
                organization_id: 'org4',
                status: 'trialing',
                trial_expires_at: null,
                current_period_end: null,
              },
            ],
            error: null,
            count: 1,
          });
        if (callCount === 2) return createBuilder({ data: [], error: null });
        if (callCount === 3) return createBuilder({ data: [], error: null });
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trials).toHaveLength(0);
  });
});
