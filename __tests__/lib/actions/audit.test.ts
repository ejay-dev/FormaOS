jest.mock('@/lib/supabase/server', () => {
  const mockQuery: Record<string, any> = {};
  mockQuery.from = jest.fn(() => mockQuery);
  mockQuery.select = jest.fn(() => mockQuery);
  mockQuery.eq = jest.fn(() => mockQuery);
  mockQuery.maybeSingle = jest.fn(() =>
    Promise.resolve({ data: { organization_id: 'org-1' }, error: null }),
  );
  mockQuery.auth = {
    getUser: jest.fn(() =>
      Promise.resolve({
        data: { user: { id: 'u1', email: 'test@example.com' } },
      }),
    ),
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(mockQuery),
    __query: mockQuery,
  };
});

jest.mock('@/lib/audit/org-audit-log', () => ({
  insertOrgAuditLog: jest.fn(() => Promise.resolve()),
}));

function getQuery() {
  return require('@/lib/supabase/server').__query;
}

import { logActivity } from '@/lib/actions/audit';

describe('logActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const q = getQuery();
    q.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@example.com' } },
    });
    q.maybeSingle.mockResolvedValue({
      data: { organization_id: 'org-1' },
      error: null,
    });
  });

  it('calls insertOrgAuditLog with correct params', async () => {
    await logActivity({
      type: 'LOGIN',
      description: 'User logged in',
      metadata: { ip: '127.0.0.1' },
    });
    const { insertOrgAuditLog } = require('@/lib/audit/org-audit-log');
    expect(insertOrgAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organization_id: 'org-1',
        actor_id: 'u1',
        actor_email: 'test@example.com',
        action: 'LOGIN',
        target: 'User logged in',
        domain: 'system',
        severity: 'low',
      }),
    );
  });

  it('does nothing when user is not authenticated', async () => {
    getQuery().auth.getUser.mockResolvedValue({
      data: { user: null },
    });
    await logActivity({ type: 'TEST', description: 'test' });
    const { insertOrgAuditLog } = require('@/lib/audit/org-audit-log');
    expect(insertOrgAuditLog).not.toHaveBeenCalled();
  });

  it('does nothing when no membership found', async () => {
    getQuery().maybeSingle.mockResolvedValue({ data: null, error: null });
    await logActivity({ type: 'TEST', description: 'test' });
    const { insertOrgAuditLog } = require('@/lib/audit/org-audit-log');
    expect(insertOrgAuditLog).not.toHaveBeenCalled();
  });
});
