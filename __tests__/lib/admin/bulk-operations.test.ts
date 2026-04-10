/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import { executeBulkOperation } from '@/lib/admin/bulk-operations';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function mockDb() {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.upsert = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.single = jest.fn().mockResolvedValue({
    data: { trial_expires_at: '2026-01-01' },
    error: null,
  });
  // For count queries
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: any) => void) => resolve({ count: 5, error: null }),
    writable: true,
    configurable: true,
  });

  const db = { from: jest.fn().mockReturnValue(chain) };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);
  return db;
}

describe('lib/admin/bulk-operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const targets = [
    { orgId: 'org1', orgName: 'Acme' },
    { orgId: 'org2', orgName: 'Beta' },
  ];

  it('returns preview when dryRun=true', async () => {
    mockDb();
    const result = await executeBulkOperation(
      'suspend_orgs',
      targets,
      'admin1',
      true,
    );

    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('affectedUsers');
    expect((result as any).operation).toBe('suspend_orgs');
  });

  it('warns when suspending >10 orgs', async () => {
    mockDb();
    const manyTargets = Array.from({ length: 15 }, (_, i) => ({
      orgId: `org${i}`,
    }));
    const result = await executeBulkOperation(
      'suspend_orgs',
      manyTargets,
      'admin1',
      true,
    );
    expect((result as any).warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('15 organizations')]),
    );
  });

  it('warns when update_plan has active subscriptions', async () => {
    mockDb();
    const result = await executeBulkOperation(
      'update_plan',
      targets,
      'admin1',
      true,
    );
    expect((result as any).warnings.length).toBeGreaterThan(0);
  });

  it('executes suspend operation', async () => {
    const _db = mockDb();
    const result = await executeBulkOperation(
      'suspend_orgs',
      targets,
      'admin1',
      false,
    );

    expect((result as any).succeeded).toBe(2);
    expect((result as any).failed).toBe(0);
  });

  it('executes extend_trials operation', async () => {
    const _db = mockDb();
    const result = await executeBulkOperation(
      'extend_trials',
      [{ orgId: 'org1' }],
      'admin1',
      false,
      { days: 30 },
    );
    expect((result as any).succeeded).toBe(1);
  });

  it('executes recalculate_health operation', async () => {
    const _db = mockDb();
    const result = await executeBulkOperation(
      'recalculate_health',
      [{ orgId: 'org1' }],
      'admin1',
      false,
    );
    expect((result as any).succeeded).toBe(1);
  });

  it('handles failure in one target', async () => {
    const db = mockDb();
    // Make update throw for the second call
    let callCount = 0;
    db.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        callCount++;
        if (callCount === 2) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockRejectedValue(new Error('DB down')),
            }),
          };
        }
      }
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.in = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.update = jest.fn().mockReturnValue(chain);
      chain.insert = jest.fn().mockResolvedValue({ data: null, error: null });
      return chain;
    });

    const result = await executeBulkOperation(
      'suspend_orgs',
      targets,
      'admin1',
      false,
    );
    expect((result as any).failed).toBeGreaterThanOrEqual(1);
  });

  it('writes audit log after execution', async () => {
    const db = mockDb();
    await executeBulkOperation(
      'suspend_orgs',
      [{ orgId: 'org1' }],
      'admin1',
      false,
    );
    // Check admin_audit_log was called
    expect(db.from).toHaveBeenCalledWith('admin_audit_log');
  });
});
