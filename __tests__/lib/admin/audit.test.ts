/**
 * @jest-environment node
 */

function createBuilder(result = { data: null, error: null } as any) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

const writeAuditLogMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/audit/audit-engine', () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLogMock(...args),
}));

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import { logAdminAction, type AdminAuditEntry } from '@/lib/admin/audit';

beforeEach(() => {
  jest.clearAllMocks();
  writeAuditLogMock.mockResolvedValue(undefined);
});

describe('logAdminAction', () => {
  const entry: AdminAuditEntry = {
    actorUserId: 'user-1',
    action: 'delete_org',
    targetType: 'organization',
    targetId: 'org-1',
  };

  it('inserts into both admin_audit_log and audit_log', async () => {
    await logAdminAction(entry);
    expect(getClient().from).toHaveBeenCalledWith('admin_audit_log');
    expect(getClient().from).toHaveBeenCalledWith('audit_log');
  });

  it('passes metadata when provided', async () => {
    await logAdminAction({ ...entry, metadata: { reason: 'test' } });
    expect(getClient().from).toHaveBeenCalledTimes(2);
  });

  it('defaults metadata to empty object when not provided', async () => {
    await logAdminAction(entry);
    expect(getClient().from).toHaveBeenCalledTimes(2);
  });

  // Audit 2026-05-23 — orgId threading
  it('does NOT call writeAuditLog when orgId is omitted', async () => {
    await logAdminAction(entry);
    expect(writeAuditLogMock).not.toHaveBeenCalled();
  });

  it('chains into the per-org hash-chain when orgId is provided', async () => {
    await logAdminAction({ ...entry, orgId: 'org-abc' });
    expect(writeAuditLogMock).toHaveBeenCalledTimes(1);
    expect(writeAuditLogMock).toHaveBeenCalledWith(
      'org-abc',
      expect.objectContaining({
        userId: 'user-1',
        action: 'delete_org',
        resourceType: 'organization',
        resourceId: 'org-1',
      }),
    );
  });

  it('swallows hash-chain failures so they do not break the admin action', async () => {
    writeAuditLogMock.mockRejectedValueOnce(new Error('chain conflict'));
    await expect(
      logAdminAction({ ...entry, orgId: 'org-abc' }),
    ).resolves.toBeUndefined();
  });
});
