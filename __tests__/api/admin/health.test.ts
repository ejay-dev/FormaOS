/** @jest-environment node */
/**
 * Tests for app/api/admin/health/route.ts
 * Tests: GET handler auth, success, and error paths.
 */

import { NextResponse } from 'next/server';

// Proxy chain mock
function chain(data: any = null) {
  const result = { data, error: null };
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (prop in result) return (result as any)[prop];
      return (..._args: any[]) => new Proxy(result, handler);
    },
  };
  return new Proxy(result, handler);
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: jest.fn().mockReturnValue(chain([{ id: '1', event_type: 'test' }])),
  }),
}));

jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: jest.fn().mockResolvedValue({ userId: 'admin-1' }),
}));

jest.mock('@/app/api/admin/_helpers', () => ({
  handleAdminError: (_error: unknown, _route: string) =>
    NextResponse.json({ error: 'Error' }, { status: 500 }),
}));

import { GET } from '@/app/api/admin/health/route';
import { requireAdminAccess } from '@/app/app/admin/access';

describe('GET /api/admin/health', () => {
  it('returns billing and audit events on success', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('billingEvents');
    expect(body).toHaveProperty('adminAudit');
  });

  it('returns 500 when admin access denied', async () => {
    (requireAdminAccess as jest.Mock).mockRejectedValueOnce(
      new Error('Forbidden'),
    );

    const response = await GET();
    expect(response.status).toBe(500);
  });
});
