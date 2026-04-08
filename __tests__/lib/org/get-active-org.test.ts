import { getActiveOrg } from '@/lib/org/get-active-org';

function makeMockSupabase(overrides: Record<string, any> = {}) {
  const chain: Record<string, any> = {};
  chain.from = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.limit = jest.fn(() => chain);
  chain.maybeSingle = jest.fn(() =>
    Promise.resolve({ data: null, error: null }),
  );
  Object.assign(chain, overrides);
  return chain as any;
}

describe('getActiveOrg', () => {
  it('returns org when membership exists', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValue({
      data: { organization: { id: 'org-1', name: 'Acme Corp' } },
      error: null,
    });
    const result = await getActiveOrg(supabase);
    expect(result).toEqual({ id: 'org-1', name: 'Acme Corp' });
    expect(supabase.from).toHaveBeenCalledWith('org_members');
  });

  it('returns null when no membership', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    const result = await getActiveOrg(supabase);
    expect(result).toBeNull();
  });

  it('returns null when data has no organization', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValue({
      data: { organization: null },
      error: null,
    });
    const result = await getActiveOrg(supabase);
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'query failed' },
    });
    const result = await getActiveOrg(supabase);
    expect(result).toBeNull();
  });
});
