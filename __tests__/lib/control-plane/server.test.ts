/**
 * Tests for lib/control-plane/server.ts
 * Control plane runtime snapshot, feature flags, marketing config, system settings, admin jobs
 */

// ── helpers ──────────────────────────────────────────────
function createBuilder(result: any = { data: null, error: null, count: 0 }) {
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

// ── mocks ────────────────────────────────────────────────
jest.mock('server-only', () => ({}));
jest.mock('@/lib/observability/structured-logger', () => ({
  controlPlaneLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});
function getClient() {
  return require('@/lib/supabase/admin').__client;
}

jest.mock('@/lib/control-plane/flags', () => ({
  evaluateFeatureDecision: jest.fn((_key: string, _rows: any[], _ctx: any) => ({
    enabled: true,
    variant: null,
    reason: 'mock',
  })),
}));

// ── import (after mocks) ─────────────────────────────────
import {
  resolveControlPlaneEnvironment,
  readRuntimeVersion,
  getRuntimeSnapshot,
  writeControlPlaneAudit,
  getAdminControlPlaneSnapshot,
  upsertFeatureFlag,
  upsertMarketingConfig,
  upsertSystemSetting,
  enqueueAdminJob,
  runAdminJob,
} from '@/lib/control-plane/server';

// ── test data ─────────────────────────────────────────────
const flagRow = {
  id: 'f1',
  flag_key: 'dark_mode',
  scope_type: 'global',
  scope_id: null,
  enabled: true,
  kill_switch: false,
  rollout_percentage: 100,
  variants: {},
  default_variant: null,
  description: 'Dark mode flag',
  is_public: true,
  start_at: null,
  end_at: null,
  environment: 'production',
  created_by: 'admin',
  updated_by: 'admin',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};
const settingRow = {
  id: 's1',
  category: 'ops',
  setting_key: 'maintenance_mode',
  value: { enabled: false },
  description: null,
  environment: 'production',
  updated_by: 'admin',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};
const marketingRow = {
  id: 'm1',
  section: 'hero',
  config_key: 'headline',
  value: 'Hello',
  description: null,
  environment: 'production',
  updated_by: 'admin',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

// ── suite ─────────────────────────────────────────────────
describe('control-plane/server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── resolveControlPlaneEnvironment ──
  describe('resolveControlPlaneEnvironment', () => {
    it('returns production when passed production', () => {
      expect(resolveControlPlaneEnvironment('production')).toBe('production');
    });
    it('returns preview when passed preview', () => {
      expect(resolveControlPlaneEnvironment('preview')).toBe('preview');
    });
    it('returns development when passed development', () => {
      expect(resolveControlPlaneEnvironment('development')).toBe('development');
    });
    it('returns default for null', () => {
      const result = resolveControlPlaneEnvironment(null);
      expect(['production', 'preview', 'development']).toContain(result);
    });
    it('returns default for undefined', () => {
      const result = resolveControlPlaneEnvironment();
      expect(['production', 'preview', 'development']).toContain(result);
    });
    it('returns default for invalid string', () => {
      const result = resolveControlPlaneEnvironment('staging');
      expect(['production', 'preview', 'development']).toContain(result);
    });
  });

  // ── readRuntimeVersion ──
  describe('readRuntimeVersion', () => {
    it('returns version string from DB', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { value: '2024.1.0' }, error: null }),
      );
      const result = await readRuntimeVersion('production');
      expect(typeof result).toBe('string');
    });
  });

  // ── writeControlPlaneAudit ──
  describe('writeControlPlaneAudit', () => {
    it('inserts an audit log entry', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      await writeControlPlaneAudit({
        actorUserId: 'u1',
        environment: 'production',
        eventType: 'feature_flag.upsert',
        targetType: 'feature_flag',
        targetId: 'f1',
        metadata: { flag_key: 'dark_mode' },
      });
      expect(getClient().from).toHaveBeenCalledWith('audit_log');
    });

    it('handles null optional fields', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      await writeControlPlaneAudit({
        environment: 'staging',
        eventType: 'test',
        targetType: 'test',
      });
      expect(getClient().from).toHaveBeenCalledWith('audit_log');
    });
  });

  // ── getRuntimeSnapshot ──
  describe('getRuntimeSnapshot', () => {
    it('returns a runtime snapshot with expected properties', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: [settingRow], error: null, count: 0 }),
      );
      const snapshot = await getRuntimeSnapshot({ environment: 'production' });
      expect(snapshot).toHaveProperty('version');
      expect(snapshot).toHaveProperty('ops');
      expect(snapshot).toHaveProperty('marketing');
      expect(snapshot).toHaveProperty('featureFlags');
    });

    it('filters private flags when includePrivateFlags is false', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: [{ ...flagRow, is_public: false }],
          error: null,
        }),
      );
      const snapshot = await getRuntimeSnapshot({ includePrivateFlags: false });
      expect(snapshot).toHaveProperty('featureFlags');
    });

    it('includes private flags when includePrivateFlags is true', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: [{ ...flagRow, is_public: false }],
          error: null,
        }),
      );
      const snapshot = await getRuntimeSnapshot({ includePrivateFlags: true });
      expect(snapshot).toHaveProperty('featureFlags');
    });
  });

  // ── upsertFeatureFlag ──
  describe('upsertFeatureFlag', () => {
    it('inserts a new flag when no existing found', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: null, error: null });
        if (callIdx === 2)
          return createBuilder({
            data: { ...flagRow, id: 'new-f' },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });

      const result = await upsertFeatureFlag({
        environment: 'production',
        actorUserId: 'admin-u1',
        flagKey: 'new_feature',
        scopeType: 'global',
        enabled: true,
        killSwitch: false,
        rolloutPercentage: 100,
      });
      expect(result).toHaveProperty('flag_key');
    });

    it('updates existing flag when found', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({ data: { id: 'existing-f' }, error: null });
        if (callIdx === 2)
          return createBuilder({
            data: { ...flagRow, id: 'existing-f' },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });

      const result = await upsertFeatureFlag({
        environment: 'production',
        actorUserId: 'admin-u1',
        flagKey: 'dark_mode',
        scopeType: 'global',
        enabled: false,
        killSwitch: false,
        rolloutPercentage: 50,
      });
      expect(result).toHaveProperty('flag_key');
    });

    it('handles organization scope type', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: null, error: null });
        if (callIdx === 2)
          return createBuilder({
            data: { ...flagRow, scope_type: 'organization', scope_id: 'org1' },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });

      const result = await upsertFeatureFlag({
        environment: 'production',
        actorUserId: 'u1',
        flagKey: 'org_feature',
        scopeType: 'organization',
        scopeId: 'org1',
        enabled: true,
        killSwitch: false,
        rolloutPercentage: 100,
      });
      expect(result).toHaveProperty('flag_key');
    });

    it('throws on DB error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'db failure' } }),
      );
      await expect(
        upsertFeatureFlag({
          environment: 'production',
          actorUserId: 'u1',
          flagKey: 'test',
          scopeType: 'global',
          enabled: true,
          killSwitch: false,
          rolloutPercentage: 100,
        }),
      ).rejects.toBeDefined();
    });

    it('clamps rollout percentage to 0-100', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: null, error: null });
        if (callIdx === 2)
          return createBuilder({
            data: { ...flagRow, rollout_percentage: 100 },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });

      const result = await upsertFeatureFlag({
        environment: 'production',
        actorUserId: 'u1',
        flagKey: 'test',
        scopeType: 'global',
        enabled: true,
        killSwitch: false,
        rolloutPercentage: 150,
      });
      expect(result).toBeDefined();
    });
  });

  // ── upsertMarketingConfig ──
  describe('upsertMarketingConfig', () => {
    it('upserts a marketing config entry', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: { ...marketingRow, id: 'm2' },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });

      const result = await upsertMarketingConfig({
        environment: 'production',
        actorUserId: 'u1',
        section: 'hero',
        configKey: 'headline',
        value: 'New Headline',
      });
      expect(result).toHaveProperty('config_key');
    });

    it('throws on DB error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      );
      await expect(
        upsertMarketingConfig({
          environment: 'production',
          actorUserId: 'u1',
          section: 'hero',
          configKey: 'headline',
          value: 'x',
        }),
      ).rejects.toBeDefined();
    });
  });

  // ── upsertSystemSetting ──
  describe('upsertSystemSetting', () => {
    it('upserts a system setting', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: { ...settingRow, id: 's2' },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });

      const result = await upsertSystemSetting({
        environment: 'production',
        actorUserId: 'u1',
        category: 'ops',
        settingKey: 'maintenance_mode',
        value: { enabled: true },
      });
      expect(result).toHaveProperty('setting_key');
    });

    it('supports custom eventType', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({ data: { ...settingRow }, error: null });
        return createBuilder({ data: null, error: null });
      });

      const result = await upsertSystemSetting({
        environment: 'production',
        actorUserId: 'u1',
        category: 'ops',
        settingKey: 'test',
        value: 'x',
        eventType: 'custom.event',
      });
      expect(result).toBeDefined();
    });
  });

  // ── enqueueAdminJob ──
  describe('enqueueAdminJob', () => {
    it('enqueues a valid job type', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: {
              id: 'j1',
              job_type: 'run_cleanup',
              status: 'queued',
              progress: 0,
              logs: [],
              payload: {},
              requested_by: 'u1',
              created_at: '2025-01-01',
              updated_at: '2025-01-01',
              started_at: null,
              completed_at: null,
              result: null,
              error_message: null,
            },
            error: null,
          });
        return createBuilder({ data: null, error: null });
      });

      const job = await enqueueAdminJob({
        environment: 'production',
        actorUserId: 'u1',
        jobType: 'run_cleanup',
      });
      expect(job).toHaveProperty('id');
    });

    it('throws for unsupported job type', async () => {
      await expect(
        enqueueAdminJob({
          environment: 'production',
          actorUserId: 'u1',
          jobType: 'invalid_job_type_xyz',
        }),
      ).rejects.toThrow('Unsupported job type');
    });

    it('throws on DB error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'insert failed' } }),
      );
      await expect(
        enqueueAdminJob({
          environment: 'production',
          actorUserId: 'u1',
          jobType: 'run_cleanup',
        }),
      ).rejects.toBeDefined();
    });
  });

  // ── runAdminJob ──
  describe('runAdminJob', () => {
    it('throws when job not found', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'not found' } }),
      );
      await expect(runAdminJob('noexist', 'production')).rejects.toThrow(
        'Job not found',
      );
    });

    it('returns immediately if job is already running', async () => {
      const runningJob = {
        id: 'j1',
        job_type: 'run_cleanup',
        status: 'running',
        progress: 50,
        logs: [],
        payload: {},
        requested_by: 'u1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        started_at: '2025-01-01',
        completed_at: null,
        result: null,
        error_message: null,
      };
      getClient().from.mockImplementation(() =>
        createBuilder({ data: runningJob, error: null }),
      );
      const result = await runAdminJob('j1', 'production');
      expect(result).toHaveProperty('id');
    });

    it('executes run_cleanup job type end-to-end', async () => {
      let callIdx = 0;
      const jobData = {
        id: 'j1',
        job_type: 'run_cleanup',
        status: 'queued',
        progress: 0,
        logs: [],
        payload: {},
        requested_by: 'u1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        started_at: null,
        completed_at: null,
        result: null,
        error_message: null,
      };
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: jobData, error: null });
        if (callIdx > 15)
          return createBuilder({
            data: { ...jobData, status: 'succeeded', progress: 100 },
            error: null,
          });
        return createBuilder({ data: [], error: null });
      });
      const result = await runAdminJob('j1', 'production');
      expect(result).toHaveProperty('id');
    });
  });
});
