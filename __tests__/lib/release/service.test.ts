jest.mock('server-only', () => ({}));

jest.mock('@/lib/supabase/admin', () => {
  const mockQuery: Record<string, any> = {};
  mockQuery.from = jest.fn(() => mockQuery);
  mockQuery.select = jest.fn(() => mockQuery);
  mockQuery.eq = jest.fn(() => mockQuery);
  mockQuery.order = jest.fn(() => mockQuery);
  mockQuery.limit = jest.fn(() => mockQuery);
  mockQuery.maybeSingle = jest.fn(() =>
    Promise.resolve({ data: null, error: null }),
  );
  return {
    createSupabaseAdminClient: jest.fn(() => mockQuery),
    __query: mockQuery,
  };
});

jest.mock('@/config/release', () => ({
  CURRENT_VERSION: '2.2.3',
  CURRENT_RELEASE_NAME: 'Horizon',
}));

function getMockQuery() {
  return require('@/lib/supabase/admin').__query;
}

import {
  getCurrentRelease,
  getReleaseMetadata,
  isFeatureEnabled,
  invalidateReleaseCache,
} from '@/lib/release/service';

describe('release/service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Always invalidate cache between tests
    invalidateReleaseCache();
    getMockQuery().maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('getCurrentRelease', () => {
    it('returns fallback when DB has no data', async () => {
      const release = await getCurrentRelease();
      expect(release.version_code).toBe('2.2.3');
      expect(release.release_name).toBe('Horizon');
      expect(release.release_status).toBe('stable');
      expect(release.is_locked).toBe(true);
    });

    it('returns release from DB', async () => {
      const dbRelease = {
        id: 'rel-1',
        version_code: '3.0.0',
        release_name: 'Sovereign',
        release_status: 'stable',
        release_date: '2025-06-01',
        release_notes: 'Big release',
        feature_flags: { dark_mode: true },
        schema_version: '1.0',
        ui_version: '3.0.0',
        compatibility_min_version: '2.0.0',
        is_locked: false,
        created_by: 'admin',
        created_at: '2025-06-01T00:00:00Z',
        updated_at: '2025-06-01T00:00:00Z',
      };
      getMockQuery().maybeSingle.mockResolvedValue({
        data: dbRelease,
        error: null,
      });
      const release = await getCurrentRelease();
      expect(release.version_code).toBe('3.0.0');
      expect(release.release_name).toBe('Sovereign');
    });

    it('returns cached release on second call', async () => {
      const dbRelease = {
        id: 'rel-1',
        version_code: '3.0.0',
        release_name: 'Sovereign',
        release_status: 'stable',
        release_date: '2025-06-01',
        release_notes: null,
        feature_flags: {},
        schema_version: null,
        ui_version: '3.0.0',
        compatibility_min_version: '2.0.0',
        is_locked: false,
        created_by: null,
        created_at: '2025-06-01T00:00:00Z',
        updated_at: '2025-06-01T00:00:00Z',
      };
      getMockQuery().maybeSingle.mockResolvedValue({
        data: dbRelease,
        error: null,
      });
      await getCurrentRelease();
      await getCurrentRelease();
      // Should only call DB once due to caching
      expect(getMockQuery().from).toHaveBeenCalledTimes(1);
    });

    it('returns fallback on DB error', async () => {
      getMockQuery().maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'connection refused' },
      });
      const release = await getCurrentRelease();
      expect(release.version_code).toBe('2.2.3');
    });

    it('returns fallback on exception', async () => {
      getMockQuery().maybeSingle.mockRejectedValue(new Error('timeout'));
      const release = await getCurrentRelease();
      expect(release.version_code).toBe('2.2.3');
    });
  });

  describe('getReleaseMetadata', () => {
    it('returns formatted metadata', async () => {
      const meta = await getReleaseMetadata();
      expect(meta.version).toBe('2.2.3');
      expect(meta.name).toBe('Horizon');
      expect(meta.displayName).toBe('FormaOS Horizon — v2.2.3');
      expect(meta.tag).toBe('Enterprise Release');
    });

    it('uses DB release data when available', async () => {
      getMockQuery().maybeSingle.mockResolvedValue({
        data: {
          id: 'r1',
          version_code: '4.0.0',
          release_name: 'Citadel',
          release_status: 'stable',
          release_date: '2025-07-01',
          release_notes: null,
          feature_flags: {},
          schema_version: null,
          ui_version: null,
          compatibility_min_version: null,
          is_locked: false,
          created_by: null,
          created_at: '2025-07-01T00:00:00Z',
          updated_at: '2025-07-01T00:00:00Z',
        },
        error: null,
      });
      const meta = await getReleaseMetadata();
      expect(meta.displayName).toBe('FormaOS Citadel — v4.0.0');
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns true when flag is not defined (permissive)', async () => {
      // Fallback release has empty feature_flags
      expect(await isFeatureEnabled('nonexistent_flag')).toBe(true);
    });

    it('returns true when feature_flags is null', async () => {
      getMockQuery().maybeSingle.mockResolvedValue({
        data: {
          id: 'r1',
          version_code: '3.0.0',
          release_name: 'Test',
          release_status: 'stable',
          release_date: null,
          release_notes: null,
          feature_flags: null,
          schema_version: null,
          ui_version: null,
          compatibility_min_version: null,
          is_locked: false,
          created_by: null,
          created_at: '',
          updated_at: '',
        },
        error: null,
      });
      expect(await isFeatureEnabled('anything')).toBe(true);
    });

    it('returns flag value when defined', async () => {
      getMockQuery().maybeSingle.mockResolvedValue({
        data: {
          id: 'r1',
          version_code: '3.0.0',
          release_name: 'Test',
          release_status: 'stable',
          release_date: null,
          release_notes: null,
          feature_flags: { dark_mode: true, beta: false },
          schema_version: null,
          ui_version: null,
          compatibility_min_version: null,
          is_locked: false,
          created_by: null,
          created_at: '',
          updated_at: '',
        },
        error: null,
      });
      expect(await isFeatureEnabled('dark_mode')).toBe(true);
      invalidateReleaseCache();
      getMockQuery().maybeSingle.mockResolvedValue({
        data: {
          id: 'r1',
          version_code: '3.0.0',
          release_name: 'Test',
          release_status: 'stable',
          release_date: null,
          release_notes: null,
          feature_flags: { dark_mode: true, beta: false },
          schema_version: null,
          ui_version: null,
          compatibility_min_version: null,
          is_locked: false,
          created_by: null,
          created_at: '',
          updated_at: '',
        },
        error: null,
      });
      expect(await isFeatureEnabled('beta')).toBe(false);
    });
  });

  describe('invalidateReleaseCache', () => {
    it('forces a fresh DB fetch after invalidation', async () => {
      const dbRelease = {
        id: 'r1',
        version_code: '3.0.0',
        release_name: 'Sovereign',
        release_status: 'stable',
        release_date: null,
        release_notes: null,
        feature_flags: {},
        schema_version: null,
        ui_version: null,
        compatibility_min_version: null,
        is_locked: false,
        created_by: null,
        created_at: '',
        updated_at: '',
      };
      getMockQuery().maybeSingle.mockResolvedValue({
        data: dbRelease,
        error: null,
      });
      await getCurrentRelease();
      expect(getMockQuery().from).toHaveBeenCalledTimes(1);

      invalidateReleaseCache();
      await getCurrentRelease();
      expect(getMockQuery().from).toHaveBeenCalledTimes(2);
    });
  });
});
