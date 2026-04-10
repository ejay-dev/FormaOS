/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/data-residency', () => ({
  getOrgDataRegion: jest.fn(),
  getRegionConfig: jest.fn().mockReturnValue({ endpoint: 'us-east-1' }),
}));
jest.mock('@/lib/identity/audit', () => ({
  logIdentityEvent: jest.fn().mockResolvedValue(undefined),
}));

import {
  enforceResidency,
  listResidencyViolations,
} from '@/lib/data-governance/residency-enforcement';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getOrgDataRegion } from '@/lib/data-residency';
import { logIdentityEvent } from '@/lib/identity/audit';

function mockDb() {
  const chain: Record<string, jest.Mock> = {};
  chain.insert = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockResolvedValue({ data: [], error: null });
  const db = { from: jest.fn().mockReturnValue(chain) };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);
  return db;
}

describe('lib/data-governance/residency-enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows same-region operations', async () => {
    (getOrgDataRegion as jest.Mock).mockResolvedValue('us-east-1');
    const result = await enforceResidency('org1', 'read');
    expect(result.allowed).toBe(true);
    expect(result.region).toBe('us-east-1');
  });

  it('allows explicit matching regions', async () => {
    (getOrgDataRegion as jest.Mock).mockResolvedValue('eu-west-1');
    const result = await enforceResidency('org1', 'write', {
      destinationRegion: 'eu-west-1' as any,
      sourceRegion: 'eu-west-1' as any,
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks cross-region transfer', async () => {
    (getOrgDataRegion as jest.Mock).mockResolvedValue('us-east-1');
    mockDb();

    await expect(
      enforceResidency('org1', 'transfer', {
        destinationRegion: 'eu-west-1' as any,
      }),
    ).rejects.toThrow('Cross-region');
  });

  it('logs violation on block', async () => {
    (getOrgDataRegion as jest.Mock).mockResolvedValue('us-east-1');
    mockDb();

    await expect(
      enforceResidency('org1', 'export', {
        destinationRegion: 'ap-southeast-2' as any,
        resourceType: 'evidence',
      }),
    ).rejects.toThrow();

    expect(logIdentityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'governance.residency.violation',
      }),
    );
  });

  it('records violation in database', async () => {
    (getOrgDataRegion as jest.Mock).mockResolvedValue('us-east-1');
    const db = mockDb();

    try {
      await enforceResidency('org1', 'replicate', {
        sourceRegion: 'eu-central-1' as any,
      });
    } catch {}

    expect(db.from).toHaveBeenCalledWith('data_residency_violations');
  });

  describe('listResidencyViolations', () => {
    it('returns violations for org', async () => {
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue({
        data: [{ id: 'v1', operation: 'transfer' }],
        error: null,
      });
      const db = { from: jest.fn().mockReturnValue(chain) };
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

      const result = await listResidencyViolations('org1');
      expect(result).toHaveLength(1);
    });

    it('throws on db error', async () => {
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'permission denied' },
      });
      const db = { from: jest.fn().mockReturnValue(chain) };
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);

      await expect(listResidencyViolations('org1')).rejects.toThrow(
        'permission denied',
      );
    });
  });
});
