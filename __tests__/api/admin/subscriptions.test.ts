/** @jest-environment node */
/**
 * Tests for app/api/admin/subscriptions/route.ts GET handler
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

import { GET } from '@/app/api/admin/subscriptions/route';

beforeEach(() => jest.clearAllMocks());

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost:3000/api/admin/subscriptions');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

describe('GET /api/admin/subscriptions', () => {
  it('returns 403 on Unauthorized', async () => {
    requireAdminAccess.mockRejectedValue(new Error('Unauthorized'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns subscriptions without query', async () => {
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
                status: 'active',
                plan_key: 'pro',
                stripe_customer_id: 'cus_123',
                stripe_subscription_id: 'sub_123',
                current_period_end: '2025-12-31',
                trial_expires_at: null,
                payment_failures: 0,
                grace_period_end: null,
                updated_at: '2025-01-01',
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
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].organization_name).toBe('Org One');
  });

  it('filters by status', async () => {
    requireAdminAccess.mockResolvedValue({});
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: [], error: null, count: 0 })),
    });
    const res = await GET(makeRequest({ status: 'trialing' }));
    expect(res.status).toBe(200);
  });

  it('handles search query with filter', async () => {
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
                status: 'active',
                plan_key: 'pro',
                stripe_customer_id: 'cus_abc',
                stripe_subscription_id: 'sub_xyz',
                current_period_end: '2025-12-31',
                trial_expires_at: null,
                payment_failures: 0,
                grace_period_end: null,
                updated_at: '2025-01-01',
              },
            ],
            error: null,
            count: 1,
          });
        if (callCount === 2)
          return createBuilder({
            data: [{ id: 'org1', name: 'Search Org' }],
            error: null,
          });
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest({ query: 'search' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBeDefined();
  });

  it('handles empty orgIds gracefully', async () => {
    requireAdminAccess.mockResolvedValue({});
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => createBuilder({ data: [], error: null, count: 0 })),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(0);
  });

  it('handles null org names', async () => {
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
                status: 'active',
                plan_key: 'basic',
                stripe_customer_id: null,
                stripe_subscription_id: null,
                current_period_end: null,
                trial_expires_at: '2025-06-01',
                payment_failures: 0,
                grace_period_end: null,
                updated_at: '2025-01-01',
              },
            ],
            error: null,
            count: 1,
          });
        if (callCount === 2)
          return createBuilder({
            data: [{ id: 'org1', name: null }],
            error: null,
          });
        return createBuilder({ data: null, error: null });
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].organization_name).toBe('N/A');
  });
});
