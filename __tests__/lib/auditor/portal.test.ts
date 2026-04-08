const mockQuery: Record<string, jest.Mock> = {};

function resetMock() {
  mockQuery.from = jest.fn().mockReturnValue(mockQuery);
  mockQuery.select = jest.fn().mockReturnValue(mockQuery);
  mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.update = jest.fn().mockReturnValue(mockQuery);
  mockQuery.upsert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.in = jest.fn().mockReturnValue(mockQuery);
  mockQuery.is = jest.fn().mockReturnValue(mockQuery);
  mockQuery.gt = jest.fn().mockReturnValue(mockQuery);
  mockQuery.order = jest.fn().mockReturnValue(mockQuery);
  mockQuery.limit = jest.fn().mockReturnValue(mockQuery);
  mockQuery.single = jest.fn().mockReturnValue(mockQuery);
  mockQuery.then = jest.fn((r: Function) => r({ data: null, error: null }));
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('a'.repeat(32))),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'hashed_token'),
  })),
}));

import {
  createAuditorAccess,
  revokeAuditorAccess,
  validateAuditorToken,
  listAuditorAccess,
  getAuditorActivity,
  logAuditorActivity,
} from '@/lib/auditor/portal';

beforeEach(() => {
  resetMock();
  jest.clearAllMocks();
});

describe('createAuditorAccess', () => {
  it('inserts token and returns raw token + record', async () => {
    const record = { id: 'tok-1', auditor_name: 'Jane' };
    mockQuery.single.mockReturnValue(
      Promise.resolve({ data: record, error: null }),
    );

    const result = await createAuditorAccess('org-1', 'user-1', {
      auditorName: 'Jane',
      auditorEmail: 'jane@audit.com',
      scopes: { frameworks: ['soc2'] },
      expiresInDays: 30,
    });

    expect(result.token).toBeDefined();
    expect(result.record).toEqual(record);
    expect(mockQuery.from).toHaveBeenCalledWith('auditor_access_tokens');
    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        auditor_name: 'Jane',
        auditor_email: 'jane@audit.com',
      }),
    );
  });

  it('throws on insert error', async () => {
    mockQuery.single.mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'insert failed' } }),
    );
    await expect(
      createAuditorAccess('org-1', 'user-1', {
        auditorName: 'X',
        auditorEmail: 'x@y.com',
        scopes: {},
        expiresInDays: 1,
      }),
    ).rejects.toThrow('insert failed');
  });
});

describe('revokeAuditorAccess', () => {
  it('updates revoked_at field', async () => {
    // eq is called twice: .eq('id', ...).eq('org_id', ...)
    // First eq returns mockQuery, second eq resolves
    let eqCount = 0;
    mockQuery.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount % 2 === 0) return Promise.resolve({ error: null });
      return mockQuery;
    });
    await revokeAuditorAccess('tok-1', 'org-1');
    expect(mockQuery.from).toHaveBeenCalledWith('auditor_access_tokens');
    expect(mockQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) }),
    );
  });

  it('throws on error', async () => {
    let eqCount = 0;
    mockQuery.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount % 2 === 0)
        return Promise.resolve({ error: { message: 'fail' } });
      return mockQuery;
    });
    await expect(revokeAuditorAccess('tok-1', 'org-1')).rejects.toThrow('fail');
  });
});

describe('validateAuditorToken', () => {
  it('returns null for invalid token', async () => {
    mockQuery.single.mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'not found' } }),
    );
    const result = await validateAuditorToken('bad-token');
    expect(result).toBeNull();
  });

  it('returns token data and updates access stats for valid token', async () => {
    const tokenData = { id: 'tok-1', access_count: 5 };
    // First call: select single -> returns token data
    // Second call: update -> success
    let callCount = 0;
    mockQuery.single.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: tokenData, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
    mockQuery.eq.mockReturnValue(mockQuery);

    const result = await validateAuditorToken('good-token');
    expect(result).toEqual(tokenData);
  });
});

describe('listAuditorAccess', () => {
  it('returns tokens with computed status', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 86400000).toISOString();
    const past = new Date(now.getTime() - 86400000).toISOString();

    mockQuery.then.mockImplementation((r: Function) =>
      r({
        data: [
          { id: '1', expires_at: future, revoked_at: null },
          { id: '2', expires_at: past, revoked_at: null },
          { id: '3', expires_at: future, revoked_at: '2024-01-01' },
        ],
        error: null,
      }),
    );

    const result = await listAuditorAccess('org-1');
    expect(result).toHaveLength(3);
    expect(result[0].status).toBe('active');
    expect(result[1].status).toBe('expired');
    expect(result[2].status).toBe('revoked');
  });

  it('returns empty array when no tokens', async () => {
    mockQuery.then.mockImplementation((r: Function) =>
      r({ data: null, error: null }),
    );
    const result = await listAuditorAccess('org-1');
    expect(result).toEqual([]);
  });
});

describe('getAuditorActivity', () => {
  it('queries activity log for org', async () => {
    mockQuery.then.mockImplementation((r: Function) =>
      r({ data: [{ id: '1', action: 'view' }], error: null }),
    );
    const result = await getAuditorActivity('org-1');
    expect(mockQuery.from).toHaveBeenCalledWith('auditor_activity_log');
    expect(result).toEqual([{ id: '1', action: 'view' }]);
  });

  it('filters by tokenId when provided', async () => {
    mockQuery.then.mockImplementation((r: Function) =>
      r({ data: [], error: null }),
    );
    await getAuditorActivity('org-1', 'tok-1');
    expect(mockQuery.eq).toHaveBeenCalledWith('token_id', 'tok-1');
  });
});

describe('logAuditorActivity', () => {
  it('inserts activity log entry', async () => {
    mockQuery.insert.mockReturnValue(Promise.resolve({ error: null }));
    await logAuditorActivity(
      'tok-1',
      'org-1',
      'download',
      'evidence',
      'ev-1',
      '1.2.3.4',
      'Mozilla',
    );
    expect(mockQuery.from).toHaveBeenCalledWith('auditor_activity_log');
    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        token_id: 'tok-1',
        org_id: 'org-1',
        action: 'download',
        resource_type: 'evidence',
        ip_address: '1.2.3.4',
      }),
    );
  });
});
