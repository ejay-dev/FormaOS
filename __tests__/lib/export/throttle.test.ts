/**
 * Tests for lib/export/throttle.ts
 */

function createBuilder(result = { data: null, error: null, count: 0 } as any) {
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
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
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

import {
  canStartExport,
  trackExportStart,
  trackExportEnd,
  getExportStats,
  cleanupStaleExports,
} from '@/lib/export/throttle';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('canStartExport', () => {
  it('returns allowed when under all limits', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null, count: 1 }),
    );
    const result = await canStartExport('org-1');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects when global limit exceeded', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null, count: 10 }),
    );
    const result = await canStartExport('org-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('maximum number of exports');
  });

  it('rejects when per-org limit exceeded', async () => {
    let callNum = 0;
    getClient().from.mockImplementation(() => {
      callNum++;
      // First call is global (count under limit), second is per-org (at limit)
      if (callNum <= 1)
        return createBuilder({ data: null, error: null, count: 1 });
      return createBuilder({ data: null, error: null, count: 2 });
    });
    const result = await canStartExport('org-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Maximum concurrent exports');
  });
});

describe('getExportStats', () => {
  it('returns static stats object', () => {
    const stats = getExportStats();
    expect(stats).toEqual({
      globalActive: 0,
      globalLimit: 10,
      perOrgLimit: 2,
      orgsWithActiveExports: 0,
    });
  });

  it('globalLimit is 10', () => {
    expect(getExportStats().globalLimit).toBe(10);
  });

  it('perOrgLimit is 2', () => {
    expect(getExportStats().perOrgLimit).toBe(2);
  });
});

describe('trackExportStart', () => {
  it('is a no-op function', () => {
    expect(() => trackExportStart('org1', 'job1')).not.toThrow();
  });
});

describe('trackExportEnd', () => {
  it('is a no-op function', () => {
    expect(() => trackExportEnd('org1', 'job1')).not.toThrow();
  });
});

describe('cleanupStaleExports', () => {
  it('is a no-op function', () => {
    expect(() => cleanupStaleExports(['j1', 'j2'])).not.toThrow();
  });

  it('handles empty array', () => {
    expect(() => cleanupStaleExports([])).not.toThrow();
  });
});
