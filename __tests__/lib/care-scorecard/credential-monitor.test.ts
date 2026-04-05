jest.mock('server-only', () => ({}));

const mockQuery: any = {};
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

import {
  getExpiringCredentials,
  getExpiredCredentials,
  generateCredentialAlerts,
  getCredentialSummaryByType,
} from '@/lib/care-scorecard/credential-monitor';

function setupChainMock(results: Array<{ data: any; error: any }>) {
  let callIndex = 0;
  mockQuery.from = jest.fn(() => mockQuery);
  mockQuery.select = jest.fn(() => mockQuery);
  mockQuery.eq = jest.fn(() => mockQuery);
  mockQuery.gte = jest.fn(() => mockQuery);
  mockQuery.lte = jest.fn(() => mockQuery);
  mockQuery.lt = jest.fn(() => mockQuery);
  mockQuery.in = jest.fn(() => mockQuery);
  mockQuery.order = jest.fn(() => mockQuery);
  mockQuery.limit = jest.fn(() => mockQuery);
  mockQuery.then = jest.fn((resolve: any) => {
    const result = results[callIndex] || { data: null, error: null };
    callIndex++;
    return resolve(result);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getExpiringCredentials', () => {
  it('returns mapped credentials with user details', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const credentials = [
      {
        id: 'cred-1',
        user_id: 'user-1',
        credential_type: 'wwcc',
        name: 'Working With Children',
        credential_number: 'WC12345',
        expires_at: futureDate.toISOString(),
        status: 'verified',
        document_url: 'https://example.com/doc.pdf',
      },
    ];
    const members = [
      {
        user_id: 'user-1',
        profiles: { full_name: 'Alice Smith', email: 'alice@test.com' },
      },
    ];

    setupChainMock([
      { data: credentials, error: null },
      { data: members, error: null },
    ]);

    const result = await getExpiringCredentials('org-1');
    expect(result).toHaveLength(1);
    expect(result[0].staffName).toBe('Alice Smith');
    expect(result[0].staffEmail).toBe('alice@test.com');
    expect(result[0].type).toBe('wwcc');
    expect(result[0].daysUntilExpiry).toBeGreaterThan(0);
  });

  it('returns empty array on error', async () => {
    setupChainMock([{ data: null, error: { message: 'DB error' } }]);

    const result = await getExpiringCredentials('org-1');
    expect(result).toEqual([]);
  });

  it('handles missing user details gracefully', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    setupChainMock([
      {
        data: [
          {
            id: 'cred-1',
            user_id: 'unknown',
            credential_type: 'cpr',
            name: 'CPR',
            credential_number: null,
            expires_at: futureDate.toISOString(),
            status: 'verified',
            document_url: null,
          },
        ],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getExpiringCredentials('org-1');
    expect(result).toHaveLength(1);
    expect(result[0].staffName).toBe('Unknown');
    expect(result[0].status).toBe('expiring_soon');
  });
});

describe('getExpiredCredentials', () => {
  it('returns expired credentials with negative daysUntilExpiry', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 15);

    setupChainMock([
      {
        data: [
          {
            id: 'cred-2',
            user_id: 'user-2',
            credential_type: 'first_aid',
            name: 'First Aid',
            credential_number: 'FA001',
            expires_at: pastDate.toISOString(),
            status: 'expired',
            document_url: null,
          },
        ],
        error: null,
      },
      {
        data: [
          {
            user_id: 'user-2',
            profiles: { full_name: 'Bob Jones', email: 'bob@test.com' },
          },
        ],
        error: null,
      },
    ]);

    const result = await getExpiredCredentials('org-1');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('expired');
    expect(result[0].daysUntilExpiry).toBeLessThan(0);
  });
});

describe('generateCredentialAlerts', () => {
  it('generates critical alert for expired credentials', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 5);
    const monthAhead = new Date();
    monthAhead.setDate(monthAhead.getDate() + 20);

    // This function calls getExpiredCredentials, getExpiringCredentials(30), getExpiringCredentials(7)
    // Each of those makes 2 DB calls (credentials + members), so 6 calls total
    setupChainMock([
      // getExpiredCredentials: credentials
      {
        data: [
          {
            id: 'exp-1',
            user_id: 'u1',
            credential_type: 'cpr',
            name: 'CPR',
            credential_number: null,
            expires_at: pastDate.toISOString(),
            status: 'expired',
            document_url: null,
          },
        ],
        error: null,
      },
      // getExpiredCredentials: members
      { data: [], error: null },
      // getExpiringCredentials(30): credentials
      {
        data: [
          {
            id: 'soon-1',
            user_id: 'u2',
            credential_type: 'wwcc',
            name: 'WWCC',
            credential_number: null,
            expires_at: monthAhead.toISOString(),
            status: 'verified',
            document_url: null,
          },
        ],
        error: null,
      },
      // getExpiringCredentials(30): members
      { data: [], error: null },
      // getExpiringCredentials(7): credentials
      { data: [], error: null },
      // getExpiringCredentials(7): members
      { data: [], error: null },
    ]);

    const alerts = await generateCredentialAlerts('org-1');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const criticalAlerts = alerts.filter((a) => a.type === 'critical');
    expect(criticalAlerts.length).toBeGreaterThanOrEqual(1);
    expect(criticalAlerts[0].category).toBe('credentials');
  });
});

describe('getCredentialSummaryByType', () => {
  it('returns summary grouped by credential type', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    setupChainMock([
      {
        data: [
          {
            credential_type: 'wwcc',
            status: 'verified',
            expires_at: futureDate.toISOString(),
          },
          {
            credential_type: 'wwcc',
            status: 'expired',
            expires_at: pastDate.toISOString(),
          },
          {
            credential_type: 'cpr',
            status: 'verified',
            expires_at: futureDate.toISOString(),
          },
        ],
        error: null,
      },
    ]);

    const result = await getCredentialSummaryByType('org-1');
    expect(result.length).toBeGreaterThanOrEqual(1);

    const wwcc = result.find((r) => r.type === 'wwcc');
    expect(wwcc).toBeDefined();
    expect(wwcc!.total).toBe(2);
    expect(wwcc!.label).toBe('Working With Children Check');
  });

  it('returns empty array for no credentials', async () => {
    setupChainMock([{ data: [], error: null }]);
    const result = await getCredentialSummaryByType('org-1');
    expect(result).toEqual([]);
  });
});
