/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import {
  riskWeightFromLevel,
  riskLevelFromWeight,
} from '@/lib/frameworks/compliance-controls-schema';

describe('lib/frameworks/compliance-controls-schema', () => {
  describe('riskWeightFromLevel', () => {
    it('returns 8 for critical', () => {
      expect(riskWeightFromLevel('critical')).toBe(8);
    });

    it('returns 5 for high', () => {
      expect(riskWeightFromLevel('high')).toBe(5);
    });

    it('returns 3 for medium', () => {
      expect(riskWeightFromLevel('medium')).toBe(3);
    });

    it('returns 1 for low', () => {
      expect(riskWeightFromLevel('low')).toBe(1);
    });

    it('returns 3 for null/undefined', () => {
      expect(riskWeightFromLevel(null)).toBe(3);
      expect(riskWeightFromLevel(undefined)).toBe(3);
    });

    it('is case-insensitive', () => {
      expect(riskWeightFromLevel('CRITICAL')).toBe(8);
      expect(riskWeightFromLevel('High')).toBe(5);
    });
  });

  describe('riskLevelFromWeight', () => {
    it('returns critical for weight >= 7', () => {
      expect(riskLevelFromWeight(8)).toBe('critical');
      expect(riskLevelFromWeight(7)).toBe('critical');
    });

    it('returns high for weight >= 5', () => {
      expect(riskLevelFromWeight(5)).toBe('high');
      expect(riskLevelFromWeight(6)).toBe('high');
    });

    it('returns low for weight <= 1', () => {
      expect(riskLevelFromWeight(1)).toBe('low');
      expect(riskLevelFromWeight(0)).toBe('low');
    });

    it('returns medium for weight 2-4', () => {
      expect(riskLevelFromWeight(3)).toBe('medium');
      expect(riskLevelFromWeight(2)).toBe('medium');
      expect(riskLevelFromWeight(4)).toBe('medium');
    });

    it('returns medium for null/undefined', () => {
      expect(riskLevelFromWeight(null)).toBe('medium');
      expect(riskLevelFromWeight(undefined)).toBe('medium');
    });
  });

  describe('detectComplianceControlsSchema', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('returns modern when query succeeds', async () => {
      // Need to re-import after module reset to clear cached schema
      jest.resetModules();
      jest.doMock('@/lib/supabase/admin', () => ({
        createSupabaseAdminClient: jest.fn(),
      }));
      const mod = await import('@/lib/frameworks/compliance-controls-schema');
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue({ error: null });
      const admin = { from: jest.fn().mockReturnValue(chain) } as any;

      const result = await mod.detectComplianceControlsSchema(admin);
      expect(result).toBe('modern');
    });

    it('returns legacy when query errors', async () => {
      jest.resetModules();
      jest.doMock('@/lib/supabase/admin', () => ({
        createSupabaseAdminClient: jest.fn(),
      }));
      const mod = await import('@/lib/frameworks/compliance-controls-schema');
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.limit = jest
        .fn()
        .mockResolvedValue({ error: new Error('column not found') });
      const admin = { from: jest.fn().mockReturnValue(chain) } as any;

      const result = await mod.detectComplianceControlsSchema(admin);
      expect(result).toBe('legacy');
    });
  });
});
