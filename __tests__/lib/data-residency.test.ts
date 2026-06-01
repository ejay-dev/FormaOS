/** @jest-environment node */

import {
  getAvailableRegions,
  getOrgDataRegion,
  getRegionConfig,
  setOrgDataRegion,
} from '@/lib/data-residency';
import { mockSupabase, setupTestEnv } from '@/tests/helpers';

const serverSupabase = mockSupabase();
const adminSupabase = mockSupabase();

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => serverSupabase.client),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => adminSupabase.client),
}));

describe('data-residency', () => {
  beforeEach(() => {
    serverSupabase.reset();
    adminSupabase.reset();
  });

  it('lists only provisioned regions (AU only until US/EU URLs are set)', () => {
    const regions = getAvailableRegions();
    // AU is always available; US/EU are hidden until their Supabase URLs exist.
    expect(regions).toEqual([
      expect.objectContaining({ region: 'au', available: true }),
    ]);
    expect(regions.find((r) => r.region === 'us')).toBeUndefined();
    expect(regions.find((r) => r.region === 'eu')).toBeUndefined();
  });

  it('exposes a region once its Supabase URL is provisioned', () => {
    const env = setupTestEnv({ SUPABASE_US_URL: 'https://us.example.supabase.co' });
    try {
      const regions = getAvailableRegions();
      expect(regions.find((r) => r.region === 'us')).toMatchObject({
        region: 'us',
        available: true,
      });
      // EU still unprovisioned → still hidden.
      expect(regions.find((r) => r.region === 'eu')).toBeUndefined();
    } finally {
      env.restore();
    }
  });

  it('returns the organization region when one is stored', async () => {
    serverSupabase.queueResponse({
      match: { table: 'organizations', action: 'select', expects: 'maybeSingle' },
      response: { data: { data_residency_region: 'eu' }, error: null },
    });

    await expect(getOrgDataRegion('org-eu')).resolves.toBe('eu');
  });

  it('defaults to AU when an organization has no configured region', async () => {
    serverSupabase.queueResponse({
      match: { table: 'organizations', action: 'select', expects: 'maybeSingle' },
      response: { data: null, error: null },
    });

    await expect(getOrgDataRegion('org-default')).resolves.toBe('au');
  });

  it('rejects unavailable or unknown regions and persists available ones', async () => {
    await expect(setOrgDataRegion('org-a', 'us')).resolves.toEqual({
      ok: false,
      error: expect.stringContaining('not yet available'),
    });

    adminSupabase.queueResponse({
      match: { table: 'organizations', action: 'update', expects: 'many' },
      response: { data: null, error: null },
    });

    await expect(setOrgDataRegion('org-a', 'au')).resolves.toEqual({ ok: true });
  });

  it('returns region-specific Supabase routing config from environment variables', () => {
    const env = setupTestEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://au.example.supabase.co',
      SUPABASE_US_URL: 'https://us.example.supabase.co',
      SUPABASE_EU_URL: 'https://eu.example.supabase.co',
    });

    try {
      expect(getRegionConfig('au')).toEqual({
        url: 'https://au.example.supabase.co',
        region: 'syd1',
      });
      expect(getRegionConfig('us')).toEqual({
        url: 'https://us.example.supabase.co',
        region: 'iad1',
      });
      expect(getRegionConfig('eu')).toEqual({
        url: 'https://eu.example.supabase.co',
        region: 'fra1',
      });
    } finally {
      env.restore();
    }
  });
});

