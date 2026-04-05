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

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import { logAdminAction, type AdminAuditEntry } from '@/lib/admin/audit';

beforeEach(() => jest.clearAllMocks());

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
});
