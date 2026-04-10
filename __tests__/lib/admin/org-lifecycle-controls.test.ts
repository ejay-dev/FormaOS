/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import {
  suspendOrg,
  restoreOrg,
  retireOrg,
  getOrgLifecycleHistory,
} from '@/lib/admin/org-lifecycle-controls';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function mockDb(
  orgData: unknown = { lifecycle_status: 'active', name: 'Acme' },
) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.is = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.single = jest.fn().mockResolvedValue({ data: orgData, error: null });
  chain.order = jest.fn().mockResolvedValue({ data: [] });

  const db = { from: jest.fn().mockReturnValue(chain) };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);
  return db;
}

describe('lib/admin/org-lifecycle-controls', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('suspendOrg', () => {
    it('suspends an active org', async () => {
      mockDb({ lifecycle_status: 'active', name: 'Acme' });
      const result = await suspendOrg('org1', 'admin1', {
        reason: 'TOS violation',
      });
      expect(result.status).toBe('suspended');
    });

    it('sets auto_restore_at when duration provided', async () => {
      mockDb({ lifecycle_status: 'active', name: 'Acme' });
      const result = await suspendOrg('org1', 'admin1', {
        reason: 'temp',
        duration: 30,
      });
      expect(result.autoRestoreAt).toBeTruthy();
    });

    it('throws when org not found', async () => {
      mockDb(null);
      await expect(
        suspendOrg('org1', 'admin1', { reason: 'test' }),
      ).rejects.toThrow('not found');
    });

    it('throws when already suspended', async () => {
      mockDb({ lifecycle_status: 'suspended', name: 'Acme' });
      await expect(
        suspendOrg('org1', 'admin1', { reason: 'test' }),
      ).rejects.toThrow('already suspended');
    });

    it('throws when retired', async () => {
      mockDb({ lifecycle_status: 'retired', name: 'Acme' });
      await expect(
        suspendOrg('org1', 'admin1', { reason: 'test' }),
      ).rejects.toThrow('retired');
    });
  });

  describe('restoreOrg', () => {
    it('restores a suspended org', async () => {
      mockDb({ lifecycle_status: 'suspended' });
      const result = await restoreOrg('org1', 'admin1', 'resolved');
      expect(result.status).toBe('active');
    });

    it('throws when org not found', async () => {
      mockDb(null);
      await expect(restoreOrg('org1', 'admin1', 'test')).rejects.toThrow(
        'not found',
      );
    });

    it('throws when not suspended', async () => {
      mockDb({ lifecycle_status: 'active' });
      await expect(restoreOrg('org1', 'admin1', 'test')).rejects.toThrow(
        'only restore suspended',
      );
    });
  });

  describe('retireOrg', () => {
    it('retires an active org', async () => {
      mockDb({ lifecycle_status: 'active' });
      const result = await retireOrg('org1', 'admin1', 'churned');
      expect(result.status).toBe('retired');
    });

    it('throws when already retired', async () => {
      mockDb({ lifecycle_status: 'retired' });
      await expect(retireOrg('org1', 'admin1', 'test')).rejects.toThrow(
        'already retired',
      );
    });

    it('throws when not found', async () => {
      mockDb(null);
      await expect(retireOrg('org1', 'admin1', 'test')).rejects.toThrow(
        'not found',
      );
    });
  });

  describe('getOrgLifecycleHistory', () => {
    it('returns audit log events', async () => {
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.in = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockResolvedValue({
        data: [{ action: 'org_suspended' }, { action: 'org_restored' }],
      });
      const db = { from: jest.fn().mockReturnValue(chain) };
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

      const result = await getOrgLifecycleHistory('org1');
      expect(result).toHaveLength(2);
    });
  });
});
