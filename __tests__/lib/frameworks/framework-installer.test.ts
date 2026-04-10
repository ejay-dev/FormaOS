/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/frameworks/loadFrameworkPack', () => ({
  loadFrameworkPack: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/frameworks/compliance-controls-schema', () => ({
  detectComplianceControlsSchema: jest.fn().mockResolvedValue('legacy'),
  riskWeightFromLevel: jest.fn((level: string) =>
    level === 'critical' ? 4 : level === 'high' ? 3 : 2,
  ),
}));

import {
  getFrameworkCodeForSlug,
  getPackFileForSlug,
  PACK_SLUGS,
  syncComplianceFramework,
  installFrameworkPack,
} from '@/lib/frameworks/framework-installer';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { loadFrameworkPack } from '@/lib/frameworks/loadFrameworkPack';

function mockChain(final: unknown) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.neq = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.upsert = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = jest.fn().mockResolvedValue(final);
  return chain;
}

describe('lib/frameworks/framework-installer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PACK_SLUGS', () => {
    it('contains all expected slugs', () => {
      expect(PACK_SLUGS).toContain('soc2');
      expect(PACK_SLUGS).toContain('iso27001');
      expect(PACK_SLUGS).toContain('gdpr');
      expect(PACK_SLUGS).toContain('hipaa');
      expect(PACK_SLUGS).toContain('pci-dss');
      expect(PACK_SLUGS).toContain('nist-csf');
      expect(PACK_SLUGS).toContain('cis-controls');
    });
  });

  describe('getFrameworkCodeForSlug', () => {
    it('returns known code for known slug', () => {
      expect(getFrameworkCodeForSlug('soc2')).toBe('SOC2');
      expect(getFrameworkCodeForSlug('iso27001')).toBe('ISO27001');
      expect(getFrameworkCodeForSlug('gdpr')).toBe('GDPR');
    });

    it('generates code from slug for unknown slugs', () => {
      expect(getFrameworkCodeForSlug('custom-framework-v2')).toBe(
        'CUSTOM_FRAMEWORK_V2',
      );
    });
  });

  describe('getPackFileForSlug', () => {
    it('returns file path for known slug', () => {
      const p = getPackFileForSlug('soc2');
      expect(p).toContain('framework-packs');
      expect(p).toContain('soc2.json');
    });

    it('returns null for unknown slug', () => {
      expect(getPackFileForSlug('unknown')).toBeNull();
    });
  });

  describe('syncComplianceFramework', () => {
    it('returns early when framework not found', async () => {
      const chain = mockChain({ data: null });
      const admin = { from: jest.fn().mockReturnValue(chain) } as any;
      (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);
      await syncComplianceFramework('soc2', admin);
      expect(admin.from).toHaveBeenCalledWith('frameworks');
    });

    it('returns early when compliance framework upsert fails', async () => {
      const frameworkChain = mockChain({
        data: { id: 'f1', name: 'SOC2', slug: 'soc2', description: 'desc' },
      });
      const complianceChain = mockChain({ data: null });
      const admin = {
        from: jest.fn((table: string) => {
          if (table === 'frameworks') return frameworkChain;
          if (table === 'compliance_frameworks') return complianceChain;
          return mockChain({ data: null });
        }),
      } as any;
      await syncComplianceFramework('soc2', admin);
      expect(admin.from).toHaveBeenCalledWith('compliance_frameworks');
    });

    it('returns early when no controls found', async () => {
      const admin = {
        from: jest.fn((table: string) => {
          if (table === 'frameworks')
            return mockChain({
              data: { id: 'f1', name: 'SOC2', slug: 'soc2' },
            });
          if (table === 'compliance_frameworks')
            return mockChain({ data: { id: 'cf1', code: 'SOC2' } });
          if (table === 'framework_domains') return mockChain({ data: [] });
          if (table === 'framework_controls') return mockChain({ data: [] });
          return mockChain({ data: null });
        }),
      } as any;
      await syncComplianceFramework('soc2', admin);
      expect(admin.from).toHaveBeenCalledWith('framework_controls');
    });
  });

  describe('installFrameworkPack', () => {
    it('throws for unknown slug', async () => {
      await expect(installFrameworkPack('unknown-pack')).rejects.toThrow(
        'Unknown framework pack',
      );
    });

    it('installs a known pack', async () => {
      (createSupabaseAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(mockChain({ data: null })),
      });
      await installFrameworkPack('soc2');
      expect(loadFrameworkPack).toHaveBeenCalled();
    });
  });
});
