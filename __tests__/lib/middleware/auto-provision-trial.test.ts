jest.mock('@/lib/observability/structured-logger', () => ({
  billingLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { autoProvisionTrialAccess } from '@/lib/middleware/auto-provision-trial';

function makeMockSupabase(overrides: Record<string, any> = {}) {
  const chain: Record<string, any> = {};
  chain.from = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.insert = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.maybeSingle = jest.fn(() =>
    Promise.resolve({ data: null, error: null }),
  );
  chain.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
  Object.assign(chain, overrides);
  return chain as any;
}

describe('autoProvisionTrialAccess', () => {
  it('returns existing org when user already has membership', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValue({
      data: { organization_id: 'org-1' },
      error: null,
    });
    const result = await autoProvisionTrialAccess(
      supabase,
      'u1',
      'test@example.com',
    );
    expect(result).toEqual({ success: true, organizationId: 'org-1' });
  });

  it('creates new org and membership for user without org', async () => {
    let callCount = 0;
    const supabase = makeMockSupabase();
    // First call: check membership -> null
    // Second call: insert org -> success
    // Third call: insert membership -> success
    // Fourth call: insert subscription -> success
    supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    supabase.single.mockResolvedValueOnce({
      data: { id: 'new-org', name: "test's Organization" },
      error: null,
    });
    supabase.insert.mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        // membership insert - no .select().single(), just returns
        return Promise.resolve({ error: null });
      }
      if (callCount === 3) {
        // subscription insert
        return Promise.resolve({ error: null });
      }
      return supabase;
    });

    const result = await autoProvisionTrialAccess(
      supabase,
      'u1',
      'test@example.com',
    );
    expect(result.success).toBe(true);
    expect(result.organizationId).toBe('new-org');
  });

  it('returns success=false when org creation fails', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    supabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'insert failed' },
    });
    const result = await autoProvisionTrialAccess(supabase, 'u1', null);
    expect(result.success).toBe(false);
  });

  it('returns success=false on unexpected error', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockRejectedValue(new Error('connection lost'));
    const result = await autoProvisionTrialAccess(supabase, 'u1', null);
    expect(result.success).toBe(false);
  });
});
