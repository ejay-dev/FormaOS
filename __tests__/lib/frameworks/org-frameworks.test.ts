/**
 * Tests for lib/frameworks/org-frameworks.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/lib/frameworks/framework-installer', () => ({
  ensureFrameworkPacksInstalled: jest.fn(),
  PACK_SLUGS: [
    'soc2',
    'nist-csf',
    'cis-controls',
    'iso27001',
    'gdpr',
    'hipaa',
    'pci-dss',
  ],
}));
jest.mock('@/lib/feature-flags', () => ({
  getServerSideFeatureFlags: jest.fn(() => ({ enableFrameworkEngine: true })),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'in',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
const { createSupabaseServerClient } = require('@/lib/supabase/server');
const { getServerSideFeatureFlags } = require('@/lib/feature-flags');

import {
  syncOrgFrameworksFromOrgRecord,
  getOrgFrameworkOverview,
  getCurrentOrgId,
} from '@/lib/frameworks/org-frameworks';

beforeEach(() => jest.clearAllMocks());

describe('syncOrgFrameworksFromOrgRecord', () => {
  it('returns empty when feature flag disabled', async () => {
    getServerSideFeatureFlags.mockReturnValue({ enableFrameworkEngine: false });
    const result = await syncOrgFrameworksFromOrgRecord('org-1');
    expect(result).toEqual([]);
  });

  it('returns empty when org has no frameworks', async () => {
    getServerSideFeatureFlags.mockReturnValue({ enableFrameworkEngine: true });
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: { frameworks: [] }, error: null }),
      ),
    });
    const result = await syncOrgFrameworksFromOrgRecord('org-1');
    expect(result).toEqual([]);
  });

  it('returns empty when frameworks is not array', async () => {
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() =>
        createBuilder({ data: { frameworks: 'not-array' }, error: null }),
      ),
    });
    const result = await syncOrgFrameworksFromOrgRecord('org-1');
    expect(result).toEqual([]);
  });

  it('normalizes and syncs valid frameworks', async () => {
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { frameworks: ['soc2', 'iso', 'unknown-fw'] },
            error: null,
          });
        return createBuilder({ data: null, error: null }); // upsert
      }),
    });
    const result = await syncOrgFrameworksFromOrgRecord('org-1');
    expect(result).toContain('soc2');
    expect(result).toContain('iso27001');
    expect(result).not.toContain('unknown-fw');
  });

  it('deduplicates normalized slugs', async () => {
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { frameworks: ['soc2', 'soc2'] },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      }),
    });
    const result = await syncOrgFrameworksFromOrgRecord('org-1');
    expect(result).toHaveLength(1);
  });

  it('normalizes alias slugs', async () => {
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: { frameworks: ['nist', 'cis', 'pci'] },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      }),
    });
    const result = await syncOrgFrameworksFromOrgRecord('org-1');
    expect(result).toContain('nist-csf');
    expect(result).toContain('cis-controls');
    expect(result).toContain('pci-dss');
  });
});

describe('getOrgFrameworkOverview', () => {
  it('returns empty when feature flag disabled', async () => {
    getServerSideFeatureFlags.mockReturnValue({ enableFrameworkEngine: false });
    const result = await getOrgFrameworkOverview('org-1');
    expect(result).toEqual([]);
  });

  it('returns empty when no enabled frameworks', async () => {
    getServerSideFeatureFlags.mockReturnValue({ enableFrameworkEngine: true });
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: { frameworks: [] }, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null }); // upsert
        if (callCount === 3) return createBuilder({ data: [], error: null }); // enabled frameworks
        return createBuilder({ data: null, error: null });
      }),
    });
    const result = await getOrgFrameworkOverview('org-1');
    expect(result).toEqual([]);
  });

  it('returns slug-only overview when no framework rows exist', async () => {
    getServerSideFeatureFlags.mockReturnValue({ enableFrameworkEngine: true });
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: { frameworks: ['soc2'] }, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null }); // upsert
        if (callCount === 3)
          return createBuilder({
            data: [{ framework_slug: 'soc2', enabled_at: '2024-01-01' }],
            error: null,
          });
        if (callCount === 4) return createBuilder({ data: [], error: null }); // frameworks table empty
        return createBuilder({ data: null, error: null });
      }),
    });
    const result = await getOrgFrameworkOverview('org-1');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('soc2');
    expect(result[0].controlCount).toBe(0);
  });

  it('returns full overview with domains and controls', async () => {
    getServerSideFeatureFlags.mockReturnValue({ enableFrameworkEngine: true });
    let callCount = 0;
    createSupabaseAdminClient.mockReturnValue({
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: { frameworks: ['soc2'] }, error: null });
        if (callCount === 2) return createBuilder({ data: null, error: null });
        if (callCount === 3)
          return createBuilder({
            data: [{ framework_slug: 'soc2', enabled_at: '2024-01-01' }],
            error: null,
          });
        if (callCount === 4)
          return createBuilder({
            data: [
              {
                id: 'fw1',
                name: 'SOC 2',
                slug: 'soc2',
                version: '2023',
                description: 'SOC 2 compliance',
                is_active: true,
              },
            ],
            error: null,
          });
        if (callCount === 5)
          return createBuilder({
            data: [
              {
                id: 'd1',
                framework_id: 'fw1',
                name: 'Security',
                sort_order: 0,
              },
            ],
            error: null,
          });
        if (callCount === 6)
          return createBuilder({
            data: [
              { id: 'c1', framework_id: 'fw1', domain_id: 'd1' },
              { id: 'c2', framework_id: 'fw1', domain_id: null },
            ],
            error: null,
          });
        return createBuilder({ data: null, error: null });
      }),
    });
    const result = await getOrgFrameworkOverview('org-1');
    expect(result).toHaveLength(1);
    expect(result[0].controlCount).toBe(2);
    expect(result[0].domains).toHaveLength(1);
    expect(result[0].domains[0].controlCount).toBe(1);
  });
});

describe('getCurrentOrgId', () => {
  it('returns org id', async () => {
    const db = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
      from: jest.fn(() =>
        createBuilder({ data: { organization_id: 'org-1' }, error: null }),
      ),
    };
    createSupabaseServerClient.mockResolvedValue(db);
    const result = await getCurrentOrgId();
    expect(result).toBe('org-1');
  });

  it('throws when not authenticated', async () => {
    const db = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    };
    createSupabaseServerClient.mockResolvedValue(db);
    await expect(getCurrentOrgId()).rejects.toThrow('Unauthorized');
  });

  it('throws when no org membership', async () => {
    const db = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      },
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    };
    createSupabaseServerClient.mockResolvedValue(db);
    await expect(getCurrentOrgId()).rejects.toThrow('Organization not found');
  });
});
