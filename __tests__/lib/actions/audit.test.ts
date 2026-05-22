jest.mock('@/lib/supabase/server', () => {
  // Mock supports both the legacy `.maybeSingle()` path (when called with
  // an explicit orgId — the action verifies membership of that one row)
  // AND the new `.limit(1)` path (when no orgId is passed; the action
  // picks the user's first membership). Tests below set the resolver
  // each test needs.
  const mockQuery: Record<string, any> = {};
  mockQuery.from = jest.fn(() => mockQuery);
  mockQuery.select = jest.fn(() => mockQuery);
  mockQuery.eq = jest.fn(() => mockQuery);
  mockQuery.order = jest.fn(() => mockQuery);
  mockQuery.limit = jest.fn(() =>
    Promise.resolve({
      data: [{ organization_id: 'org-1' }],
      error: null,
    }),
  );
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
    q.limit.mockResolvedValue({
      data: [{ organization_id: 'org-1' }],
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
    // Both the legacy single-org and the new limit(1) path return no rows.
    getQuery().maybeSingle.mockResolvedValue({ data: null, error: null });
    getQuery().limit.mockResolvedValue({ data: [], error: null });
    await logActivity({ type: 'TEST', description: 'test' });
    const { insertOrgAuditLog } = require('@/lib/audit/org-audit-log');
    expect(insertOrgAuditLog).not.toHaveBeenCalled();
  });

  it('uses explicit orgId when provided and verifies membership', async () => {
    // Audit v3-013 (2026-05-22): callers that pass orgId must have it
    // verified against their session. When the membership row matches,
    // the audit insert uses the explicit orgId.
    getQuery().maybeSingle.mockResolvedValue({
      data: { organization_id: 'org-explicit' },
      error: null,
    });
    await logActivity({
      type: 'POLICY_DELETE',
      description: 'deleted policy',
      orgId: 'org-explicit',
    });
    const { insertOrgAuditLog } = require('@/lib/audit/org-audit-log');
    expect(insertOrgAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ organization_id: 'org-explicit' }),
    );
  });

  it('drops the write silently when caller-supplied orgId is not the caller\'s', async () => {
    // Cross-org write attempt — verify rejected, no DB write.
    getQuery().maybeSingle.mockResolvedValue({ data: null, error: null });
    await logActivity({
      type: 'POLICY_DELETE',
      description: 'cross-org attempt',
      orgId: 'org-victim',
    });
    const { insertOrgAuditLog } = require('@/lib/audit/org-audit-log');
    expect(insertOrgAuditLog).not.toHaveBeenCalled();
  });
});
