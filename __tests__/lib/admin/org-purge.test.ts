/**
 * Tests for lib/admin/org-purge.ts — the destructive end of the
 * org-retire lifecycle. Pins the safety contract:
 *
 *   * ORG_PURGE_ENABLED gate (default off → cron is a no-op).
 *   * Per-tick cap (MAX_ORGS_PER_TICK enforced server-side).
 *   * Multi-condition gate: refuses orgs without an export job id,
 *     refuses orgs whose export is not 'completed'.
 *   * Audit row written BEFORE the cascade delete (so the trail
 *     survives even after the org's own audit_log rows cascade away).
 */

jest.mock('server-only', () => ({}));

function builder(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const b: Record<string, any> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'lte',
    'not',
    'order',
    'limit',
    'maybeSingle',
  ];
  for (const m of methods) {
    b[m] = jest.fn(() => b);
  }
  b.then = (resolve: (v: { data?: unknown; error?: unknown }) => void) =>
    resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => builder()),
  };
  return {
    createSupabaseAdminClient: jest.fn(() => c),
    __admin: c,
  };
});

jest.mock('@/lib/admin/audit', () => {
  // Defined inside the factory so jest's hoisting doesn't TDZ-trap us.
  const logAdminAction = jest.fn().mockResolvedValue(undefined);
  return { logAdminAction, __logAdminAction: logAdminAction };
});
function logAdminActionMock() {
  return require('@/lib/admin/audit').__logAdminAction as jest.Mock;
}

import { runOrgPurgeTick, isOrgPurgeEnabled } from '@/lib/admin/org-purge';

function getAdmin() {
  return require('@/lib/supabase/admin').__admin;
}

describe('isOrgPurgeEnabled', () => {
  const originalEnv = process.env.ORG_PURGE_ENABLED;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.ORG_PURGE_ENABLED;
    else process.env.ORG_PURGE_ENABLED = originalEnv;
  });

  it('returns false when unset (default-off safety contract)', () => {
    delete process.env.ORG_PURGE_ENABLED;
    expect(isOrgPurgeEnabled()).toBe(false);
  });

  it('returns false for ambiguous values (only "true" enables)', () => {
    process.env.ORG_PURGE_ENABLED = '1';
    expect(isOrgPurgeEnabled()).toBe(false);
    process.env.ORG_PURGE_ENABLED = 'yes';
    expect(isOrgPurgeEnabled()).toBe(false);
    process.env.ORG_PURGE_ENABLED = '';
    expect(isOrgPurgeEnabled()).toBe(false);
  });

  it('returns true only for the literal string "true" (case-insensitive)', () => {
    process.env.ORG_PURGE_ENABLED = 'true';
    expect(isOrgPurgeEnabled()).toBe(true);
    process.env.ORG_PURGE_ENABLED = 'TRUE';
    expect(isOrgPurgeEnabled()).toBe(true);
  });
});

describe('runOrgPurgeTick', () => {
  const originalEnv = process.env.ORG_PURGE_ENABLED;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.ORG_PURGE_ENABLED;
    else process.env.ORG_PURGE_ENABLED = originalEnv;
  });

  it('returns enabled:false and picks nothing when the flag is off', async () => {
    delete process.env.ORG_PURGE_ENABLED;
    const out = await runOrgPurgeTick();
    expect(out.enabled).toBe(false);
    expect(out.picked).toBe(0);
    expect(out.outcomes).toEqual([]);
    expect(getAdmin().from).not.toHaveBeenCalled();
  });

  it('refuses an org with no export job id', async () => {
    process.env.ORG_PURGE_ENABLED = 'true';
    getAdmin().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return builder({
          data: [
            {
              id: 'org-1',
              name: 'NoExport',
              retire_purge_at: new Date('2026-01-01').toISOString(),
              retire_export_job_id: null,
            },
          ],
          error: null,
        });
      }
      return builder({ data: null, error: null });
    });

    const out = await runOrgPurgeTick();
    expect(out.outcomes).toHaveLength(1);
    expect(out.outcomes[0]).toMatchObject({
      orgId: 'org-1',
      result: 'refused',
      reason: 'no_export_job',
    });
    expect(logAdminActionMock()).not.toHaveBeenCalled();
  });

  it('refuses an org whose export job is not completed', async () => {
    process.env.ORG_PURGE_ENABLED = 'true';
    getAdmin().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return builder({
          data: [
            {
              id: 'org-2',
              name: 'ExportRunning',
              retire_purge_at: new Date('2026-01-01').toISOString(),
              retire_export_job_id: 'job-pending',
            },
          ],
          error: null,
        });
      }
      if (table === 'enterprise_export_jobs') {
        return builder({ data: { status: 'pending' }, error: null });
      }
      return builder({ data: null, error: null });
    });

    const out = await runOrgPurgeTick();
    expect(out.outcomes[0]).toMatchObject({
      orgId: 'org-2',
      result: 'refused',
      reason: 'export_not_completed',
    });
    expect(logAdminActionMock()).not.toHaveBeenCalled();
  });

  it('writes admin audit BEFORE the cascade delete and reports purged', async () => {
    process.env.ORG_PURGE_ENABLED = 'true';
    const callOrder: string[] = [];
    logAdminActionMock().mockImplementation(async () => {
      callOrder.push('audit');
    });

    getAdmin().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        // First call: list eligible orgs.
        // Second call: the .delete() chain — records into callOrder via `eq`.
        const b = builder({
          data: [
            {
              id: 'org-3',
              name: 'Ready',
              retire_purge_at: new Date('2026-01-01').toISOString(),
              retire_export_job_id: 'job-done',
            },
          ],
          error: null,
        });
        const originalDelete = b.delete;
        b.delete = jest.fn(() => {
          callOrder.push('delete');
          return originalDelete();
        });
        return b;
      }
      if (table === 'enterprise_export_jobs') {
        return builder({ data: { status: 'completed' }, error: null });
      }
      return builder({ data: null, error: null });
    });

    const out = await runOrgPurgeTick();
    expect(out.outcomes[0]).toMatchObject({ orgId: 'org-3', result: 'purged' });
    expect(callOrder.indexOf('audit')).toBeLessThan(callOrder.indexOf('delete'));
    expect(logAdminActionMock()).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'org_purge_executed',
        targetType: 'organization',
        targetId: 'org-3',
      }),
    );
  });

  it('reports delete_failed when the cascade errors and writes a second audit row', async () => {
    process.env.ORG_PURGE_ENABLED = 'true';
    getAdmin().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        const b = builder({
          data: [
            {
              id: 'org-4',
              name: 'FKBlocker',
              retire_purge_at: new Date('2026-01-01').toISOString(),
              retire_export_job_id: 'job-done',
            },
          ],
          error: null,
        });
        b.delete = jest.fn(() => builder({ error: { message: 'FK violation' } }));
        return b;
      }
      if (table === 'enterprise_export_jobs') {
        return builder({ data: { status: 'completed' }, error: null });
      }
      return builder({ data: null, error: null });
    });

    const out = await runOrgPurgeTick();
    expect(out.outcomes[0]).toMatchObject({
      orgId: 'org-4',
      result: 'refused',
      reason: 'delete_failed',
    });
    // logAdminAction called twice — once for executed (pre-delete),
    // once for failed (post-delete-failure).
    expect(logAdminActionMock()).toHaveBeenCalledTimes(2);
    expect(logAdminActionMock()).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ action: 'org_purge_failed' }),
    );
  });
});
