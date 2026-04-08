import { ensureOrganization } from '@/lib/bootstrap/ensure-organization';

function makeMockSupabase() {
  const chain: Record<string, any> = {};
  chain.from = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.insert = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.delete = jest.fn(() => chain);
  chain.maybeSingle = jest.fn(() =>
    Promise.resolve({ data: null, error: null }),
  );
  chain.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
  chain.auth = {
    getUser: jest.fn(() =>
      Promise.resolve({
        data: {
          user: {
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' },
          },
        },
      }),
    ),
  };
  return chain as any;
}

describe('ensureOrganization', () => {
  it('returns existing org ID when user already has membership', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValueOnce({
      data: { organization_id: 'existing-org' },
      error: null,
    });
    const result = await ensureOrganization(supabase, 'u1');
    expect(result).toBe('existing-org');
  });

  it('creates new org when user has no membership', async () => {
    const supabase = makeMockSupabase();
    // Check membership -> null
    supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    // Create org -> success
    supabase.single.mockResolvedValueOnce({
      data: { id: 'new-org', name: 'My First Organization' },
      error: null,
    });
    // Create membership -> success (insert returns chain, but we mock to resolve)
    let insertCount = 0;
    supabase.insert.mockImplementation(() => {
      insertCount++;
      if (insertCount === 1) return supabase; // org insert -> .select().single()
      return Promise.resolve({ error: null }); // membership insert
    });

    // Mock fetch for welcome email
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as any;
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.formaos.com.au';

    const result = await ensureOrganization(supabase, 'u1');
    expect(result).toBe('new-org');

    global.fetch = originalFetch;
  });

  it('returns null when membership check fails', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'query error' },
    });
    const result = await ensureOrganization(supabase, 'u1');
    expect(result).toBeNull();
  });

  it('returns null when org creation fails', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    supabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'insert failed' },
    });
    const result = await ensureOrganization(supabase, 'u1');
    expect(result).toBeNull();
  });

  it('rolls back org and returns null when membership creation fails', async () => {
    const supabase = makeMockSupabase();
    supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    supabase.single.mockResolvedValueOnce({
      data: { id: 'new-org', name: 'My First Organization' },
      error: null,
    });
    let insertCount = 0;
    supabase.insert.mockImplementation(() => {
      insertCount++;
      if (insertCount === 1) return supabase; // org insert
      return Promise.resolve({ error: { message: 'duplicate' } }); // membership fails
    });
    // delete().eq() for rollback — eq still returns chain (which has maybeSingle etc.)

    const result = await ensureOrganization(supabase, 'u1');
    expect(result).toBeNull();
  });
});
