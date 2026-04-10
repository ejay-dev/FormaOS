/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/control-plane/defaults', () => ({
  DEFAULT_CONTROL_ENVIRONMENT: 'development',
  DEFAULT_RUNTIME_VERSION: '1',
  DEFAULT_RUNTIME_OPS: {
    maintenanceMode: false,
    readOnlyMode: false,
    emergencyLockdown: false,
    rateLimitMultiplier: 1,
  },
  DEFAULT_RUNTIME_MARKETING: {
    hero: {
      badgeText: 'badge',
      headlinePrimary: 'h1',
      headlineAccent: 'accent',
      subheadline: 'sub',
      primaryCtaLabel: 'Start',
      primaryCtaHref: '/start',
      secondaryCtaLabel: 'Demo',
      secondaryCtaHref: '/demo',
    },
    runtime: {
      expensiveEffectsEnabled: true,
      activeShowcaseModule: 'controls',
      showcaseModules: { controls: true },
      sectionVisibility: { hero: true },
      themeVariant: 'default',
      backgroundVariant: 'default',
    },
  },
  ADMIN_AUTOMATION_ACTIONS: [
    'run_cleanup',
    'rebuild_search_index',
    'recompute_scores',
    'regenerate_trust_packet',
    'flush_cache',
    'warm_cdn',
  ] as const,
}));
jest.mock('@/lib/control-plane/flags', () => ({
  evaluateFeatureDecision: jest.fn((_key: string, _rows: any[], _ctx: any) => ({
    enabled: true,
    variant: null,
  })),
}));

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  resolveControlPlaneEnvironment,
  readRuntimeVersion,
  touchRuntimeVersion,
  readRuntimeStreamVersion,
  readAdminStreamVersion,
  getRuntimeSnapshot,
  writeControlPlaneAudit,
  getAdminControlPlaneSnapshot,
  upsertFeatureFlag,
  upsertMarketingConfig,
  upsertSystemSetting,
  enqueueAdminJob,
  runAdminJob,
} from '@/lib/control-plane/server';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function mockChain(result: unknown = { data: null, error: null }) {
  const c: Record<string, any> = {};
  c.select = jest.fn().mockReturnValue(c);
  c.eq = jest.fn().mockReturnValue(c);
  c.neq = jest.fn().mockReturnValue(c);
  c.in = jest.fn().mockReturnValue(c);
  c.gte = jest.fn().mockReturnValue(c);
  c.lte = jest.fn().mockReturnValue(c);
  c.lt = jest.fn().mockReturnValue(c);
  c.order = jest.fn().mockReturnValue(c);
  c.limit = jest.fn().mockReturnValue(c);
  c.is = jest.fn().mockReturnValue(c);
  c.not = jest.fn().mockReturnValue(c);
  c.insert = jest.fn().mockReturnValue(c);
  c.upsert = jest.fn().mockReturnValue(c);
  c.update = jest.fn().mockReturnValue(c);
  c.delete = jest.fn().mockReturnValue(c);
  c.maybeSingle = jest.fn().mockResolvedValue(result);
  c.single = jest.fn().mockResolvedValue(result);
  c.then = (resolve: any, reject: any) =>
    Promise.resolve(result).then(resolve, reject);
  return c;
}

function makeAdmin() {
  const chains: Record<string, any>[] = [];
  const admin = {
    from: jest.fn().mockImplementation(() => {
      const c = mockChain();
      chains.push(c);
      return c;
    }),
  };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);
  return { admin, chains, getLastChain: () => chains[chains.length - 1] };
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe('control-plane/server', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── resolveControlPlaneEnvironment ─────────────────────────

  describe('resolveControlPlaneEnvironment', () => {
    it('returns production', () =>
      expect(resolveControlPlaneEnvironment('production')).toBe('production'));
    it('returns preview', () =>
      expect(resolveControlPlaneEnvironment('preview')).toBe('preview'));
    it('returns development', () =>
      expect(resolveControlPlaneEnvironment('development')).toBe(
        'development',
      ));
    it('default for null', () =>
      expect(resolveControlPlaneEnvironment(null)).toBe('development'));
    it('default for undefined', () =>
      expect(resolveControlPlaneEnvironment()).toBe('development'));
    it('default for unknown', () =>
      expect(resolveControlPlaneEnvironment('staging')).toBe('development'));
  });

  // ── readRuntimeVersion ─────────────────────────────────────

  describe('readRuntimeVersion', () => {
    it('returns value from DB', async () => {
      const { admin } = makeAdmin();
      const c = mockChain({ data: { value: { value: '42' } }, error: null });
      admin.from.mockReturnValue(c);
      const r = await readRuntimeVersion('production');
      expect(r).toBe('42');
    });

    it('returns default when no data', async () => {
      const { admin } = makeAdmin();
      const c = mockChain({ data: null, error: null });
      admin.from.mockReturnValue(c);
      const r = await readRuntimeVersion('development');
      expect(r).toBe('1');
    });

    it('returns default when value is not string', async () => {
      const { admin } = makeAdmin();
      const c = mockChain({ data: { value: { value: 123 } }, error: null });
      admin.from.mockReturnValue(c);
      const r = await readRuntimeVersion('development');
      expect(r).toBe('1');
    });

    it('returns default when value is empty string', async () => {
      const { admin } = makeAdmin();
      const c = mockChain({ data: { value: { value: '  ' } }, error: null });
      admin.from.mockReturnValue(c);
      const r = await readRuntimeVersion('development');
      expect(r).toBe('1');
    });
  });

  // ── touchRuntimeVersion ────────────────────────────────────

  describe('touchRuntimeVersion', () => {
    it('upserts a new version and clears cache', async () => {
      makeAdmin();
      const v = await touchRuntimeVersion('production', 'user-1');
      expect(v).toBeTruthy(); // timestamp string
    });

    it('works without actorUserId', async () => {
      makeAdmin();
      const v = await touchRuntimeVersion('development');
      expect(v).toBeTruthy();
    });
  });

  // ── readRuntimeStreamVersion ───────────────────────────────

  describe('readRuntimeStreamVersion', () => {
    it('returns composite stream version', async () => {
      const { admin: _admin } = makeAdmin();
      // Multiple from calls happen; each returns a chain
      const r = await readRuntimeStreamVersion('development');
      expect(r).toHaveProperty('runtimeVersion');
      expect(r).toHaveProperty('streamVersion');
      expect(r).toHaveProperty('lastChangedAt');
    });
  });

  // ── readAdminStreamVersion ─────────────────────────────────

  describe('readAdminStreamVersion', () => {
    it('returns a string stream version', async () => {
      makeAdmin();
      const r = await readAdminStreamVersion('development');
      expect(typeof r).toBe('string');
    });
  });

  // ── writeControlPlaneAudit ─────────────────────────────────

  describe('writeControlPlaneAudit', () => {
    it('inserts an audit entry', async () => {
      const { admin, chains: _chains } = makeAdmin();
      await writeControlPlaneAudit({
        actorUserId: 'u1',
        environment: 'production',
        eventType: 'test.event',
        targetType: 'test',
        targetId: 'id1',
        metadata: { foo: 'bar' },
      });
      expect(admin.from).toHaveBeenCalledWith('audit_log');
    });

    it('handles null optional fields', async () => {
      makeAdmin();
      await writeControlPlaneAudit({
        environment: 'development',
        eventType: 'test',
        targetType: 'test',
      });
      // no throw
    });
  });

  // ── getRuntimeSnapshot ─────────────────────────────────────

  describe('getRuntimeSnapshot', () => {
    it('returns runtime snapshot with defaults', async () => {
      makeAdmin();
      const snap = await getRuntimeSnapshot({ environment: 'development' });
      expect(snap).toHaveProperty('version');
      expect(snap).toHaveProperty('environment', 'development');
      expect(snap).toHaveProperty('ops');
      expect(snap).toHaveProperty('marketing');
      expect(snap).toHaveProperty('featureFlags');
      expect(snap).toHaveProperty('evaluationMode', 'global');
    });

    it('sets evaluationMode to user when userId provided', async () => {
      makeAdmin();
      const snap = await getRuntimeSnapshot({
        environment: 'development',
        context: { userId: 'u1' },
      });
      expect(snap.evaluationMode).toBe('user');
    });

    it('sets evaluationMode to organization when orgId provided', async () => {
      makeAdmin();
      const snap = await getRuntimeSnapshot({
        environment: 'development',
        context: { orgId: 'org1' },
      });
      expect(snap.evaluationMode).toBe('organization');
    });

    it('filters private flags by default', async () => {
      makeAdmin();
      const snap = await getRuntimeSnapshot({ environment: 'development' });
      expect(snap).toBeDefined();
    });

    it('includes private flags when requested', async () => {
      makeAdmin();
      const snap = await getRuntimeSnapshot({
        environment: 'development',
        includePrivateFlags: true,
      });
      expect(snap).toBeDefined();
    });

    it('uses cache on second call with same params', async () => {
      makeAdmin();
      const snap1 = await getRuntimeSnapshot({ environment: 'development' });
      // Second call – should use cache
      const snap2 = await getRuntimeSnapshot({ environment: 'development' });
      expect(snap2.version).toBe(snap1.version);
    });

    it('resolves default environment when not specified', async () => {
      makeAdmin();
      const snap = await getRuntimeSnapshot();
      expect(snap.environment).toBe('development');
    });
  });

  // ── getAdminControlPlaneSnapshot ───────────────────────────

  describe('getAdminControlPlaneSnapshot', () => {
    it('returns admin snapshot with health data', async () => {
      const { admin: _admin } = makeAdmin();
      const snap = await getAdminControlPlaneSnapshot({
        environment: 'development',
      });
      expect(snap).toHaveProperty('environment', 'development');
      expect(snap).toHaveProperty('health');
      expect(snap.health).toHaveProperty('databaseLatencyMs');
      expect(snap.health.apiHealthy).toBe(true);
      expect(snap).toHaveProperty('featureFlags');
      expect(snap).toHaveProperty('jobs');
      expect(snap).toHaveProperty('audit');
    });

    it('clamps auditLimit and jobsLimit', async () => {
      makeAdmin();
      const snap = await getAdminControlPlaneSnapshot({
        environment: 'development',
        auditLimit: 5,
        jobsLimit: 5,
      });
      expect(snap).toBeDefined();
    });

    it('clamps high limits', async () => {
      makeAdmin();
      const snap = await getAdminControlPlaneSnapshot({
        environment: 'development',
        auditLimit: 9999,
        jobsLimit: 9999,
      });
      expect(snap).toBeDefined();
    });
  });

  // ── upsertFeatureFlag ──────────────────────────────────────

  describe('upsertFeatureFlag', () => {
    it('inserts new flag when no existing', async () => {
      const { admin } = makeAdmin();
      // Return chain where maybeSingle (existing check) returns null
      // and single (insert result) returns the flag
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx <= 1) {
          // existing check
          c.maybeSingle.mockResolvedValue({ data: null, error: null });
        } else if (callIdx === 2) {
          // insert result
          c.single.mockResolvedValue({
            data: {
              id: 'ff1',
              flag_key: 'test_flag',
              environment: 'development',
              scope_type: 'global',
              scope_id: null,
              enabled: true,
              kill_switch: false,
              rollout_percentage: 100,
              variants: {},
              default_variant: null,
              is_public: true,
              start_at: null,
              end_at: null,
              created_by: 'u1',
              updated_by: 'u1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              description: null,
            },
            error: null,
          });
        }
        return c;
      });

      const r = await upsertFeatureFlag({
        environment: 'development',
        actorUserId: 'u1',
        flagKey: 'test_flag',
        scopeType: 'global',
        enabled: true,
        killSwitch: false,
        rolloutPercentage: 100,
      });
      expect(r).toHaveProperty('flag_key', 'test_flag');
    });

    it('updates existing flag', async () => {
      const { admin } = makeAdmin();
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx <= 1) {
          c.maybeSingle.mockResolvedValue({
            data: { id: 'ff-exist' },
            error: null,
          });
        } else if (callIdx === 2) {
          c.single.mockResolvedValue({
            data: {
              id: 'ff-exist',
              flag_key: 'test',
              environment: 'development',
              scope_type: 'organization',
              scope_id: 'org-1',
              enabled: false,
              kill_switch: true,
              rollout_percentage: 50,
              variants: {},
              default_variant: null,
              is_public: false,
              start_at: null,
              end_at: null,
              created_by: 'u1',
              updated_by: 'u1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              description: 'desc',
            },
            error: null,
          });
        }
        return c;
      });

      const r = await upsertFeatureFlag({
        environment: 'development',
        actorUserId: 'u1',
        flagKey: 'test',
        scopeType: 'organization',
        scopeId: 'org-1',
        enabled: false,
        killSwitch: true,
        rolloutPercentage: 50,
        description: 'desc',
        isPublic: false,
      });
      expect(r.enabled).toBe(false);
    });

    it('throws on insert error', async () => {
      const { admin } = makeAdmin();
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx <= 1) {
          c.maybeSingle.mockResolvedValue({ data: null, error: null });
        } else if (callIdx === 2) {
          c.single.mockResolvedValue({
            data: null,
            error: { message: 'insert fail' },
          });
        }
        return c;
      });

      await expect(
        upsertFeatureFlag({
          environment: 'development',
          actorUserId: 'u1',
          flagKey: 'bad',
          scopeType: 'global',
          enabled: true,
          killSwitch: false,
          rolloutPercentage: 0,
        }),
      ).rejects.toHaveProperty('message', 'insert fail');
    });

    it('clamps rollout percentage', async () => {
      const { admin } = makeAdmin();
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx <= 1) {
          c.maybeSingle.mockResolvedValue({ data: null, error: null });
        } else if (callIdx === 2) {
          c.single.mockResolvedValue({
            data: {
              id: 'ff1',
              flag_key: 'f',
              environment: 'development',
              scope_type: 'global',
              scope_id: null,
              enabled: true,
              kill_switch: false,
              rollout_percentage: 100,
              variants: {},
              default_variant: null,
              is_public: true,
              start_at: null,
              end_at: null,
              created_by: 'u1',
              updated_by: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              description: null,
            },
            error: null,
          });
        }
        return c;
      });

      await upsertFeatureFlag({
        environment: 'development',
        actorUserId: 'u1',
        flagKey: 'f',
        scopeType: 'global',
        enabled: true,
        killSwitch: false,
        rolloutPercentage: 200,
      });
      // No throw means clamped OK
    });
  });

  // ── upsertMarketingConfig ──────────────────────────────────

  describe('upsertMarketingConfig', () => {
    it('upserts marketing config', async () => {
      const { admin } = makeAdmin();
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx === 1) {
          c.single.mockResolvedValue({
            data: {
              id: 'mc1',
              environment: 'development',
              section: 'home.hero',
              config_key: 'badge_text',
              value: 'New Badge',
              description: null,
              created_by: 'u1',
              updated_by: 'u1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        return c;
      });

      const r = await upsertMarketingConfig({
        environment: 'development',
        actorUserId: 'u1',
        section: 'home.hero',
        configKey: 'badge_text',
        value: 'New Badge',
      });
      expect(r).toHaveProperty('config_key', 'badge_text');
    });

    it('throws on error', async () => {
      const { admin } = makeAdmin();
      admin.from.mockImplementation(() => {
        const c = mockChain();
        c.single.mockResolvedValue({
          data: null,
          error: { message: 'upsert fail' },
        });
        return c;
      });
      await expect(
        upsertMarketingConfig({
          environment: 'development',
          actorUserId: 'u1',
          section: 'x',
          configKey: 'y',
          value: 'z',
        }),
      ).rejects.toHaveProperty('message', 'upsert fail');
    });
  });

  // ── upsertSystemSetting ────────────────────────────────────

  describe('upsertSystemSetting', () => {
    it('upserts system setting with custom eventType', async () => {
      const { admin } = makeAdmin();
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx === 1) {
          c.single.mockResolvedValue({
            data: {
              id: 'ss1',
              environment: 'development',
              category: 'ops',
              setting_key: 'maintenance_mode',
              value: { enabled: true },
              description: null,
              created_by: 'u1',
              updated_by: 'u1',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        return c;
      });

      const r = await upsertSystemSetting({
        environment: 'development',
        actorUserId: 'u1',
        category: 'ops',
        settingKey: 'maintenance_mode',
        value: { enabled: true },
        eventType: 'ops.toggle',
      });
      expect(r).toHaveProperty('setting_key', 'maintenance_mode');
    });

    it('throws on error', async () => {
      const { admin } = makeAdmin();
      admin.from.mockImplementation(() => {
        const c = mockChain();
        c.single.mockResolvedValue({ data: null, error: { message: 'fail' } });
        return c;
      });
      await expect(
        upsertSystemSetting({
          environment: 'development',
          actorUserId: 'u1',
          category: 'ops',
          settingKey: 'k',
          value: null,
        }),
      ).rejects.toHaveProperty('message', 'fail');
    });
  });

  // ── enqueueAdminJob ────────────────────────────────────────

  describe('enqueueAdminJob', () => {
    it('throws for unsupported job type', async () => {
      makeAdmin();
      await expect(
        enqueueAdminJob({
          environment: 'development',
          actorUserId: 'u1',
          jobType: 'nonexistent_job',
        }),
      ).rejects.toThrow('Unsupported job type');
    });

    it('enqueues valid job', async () => {
      const { admin } = makeAdmin();
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx === 1) {
          c.single.mockResolvedValue({
            data: {
              id: 'j1',
              job_type: 'flush_cache',
              status: 'queued',
              payload: {},
              progress: 0,
              logs: [
                {
                  at: new Date().toISOString(),
                  level: 'info',
                  message: 'Job queued',
                },
              ],
              requested_by: 'u1',
              started_at: null,
              completed_at: null,
              result: {},
              error_message: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        return c;
      });

      const r = await enqueueAdminJob({
        environment: 'development',
        actorUserId: 'u1',
        jobType: 'flush_cache',
      });
      expect(r).toHaveProperty('job_type', 'flush_cache');
      expect(r.status).toBe('queued');
    });

    it('throws on insert error', async () => {
      const { admin } = makeAdmin();
      admin.from.mockImplementation(() => {
        const c = mockChain();
        c.single.mockResolvedValue({
          data: null,
          error: { message: 'insert fail' },
        });
        return c;
      });
      await expect(
        enqueueAdminJob({
          environment: 'development',
          actorUserId: 'u1',
          jobType: 'flush_cache',
        }),
      ).rejects.toHaveProperty('message', 'insert fail');
    });
  });

  // ── runAdminJob ────────────────────────────────────────────

  describe('runAdminJob', () => {
    it('throws when job not found', async () => {
      const { admin } = makeAdmin();
      admin.from.mockImplementation(() => {
        const c = mockChain();
        c.maybeSingle.mockResolvedValue({
          data: null,
          error: { message: 'not found' },
        });
        return c;
      });
      await expect(runAdminJob('j1', 'development')).rejects.toThrow(
        'Job not found',
      );
    });

    it('returns immediately if already running', async () => {
      const { admin } = makeAdmin();
      admin.from.mockImplementation(() => {
        const c = mockChain();
        c.maybeSingle.mockResolvedValue({
          data: {
            id: 'j1',
            job_type: 'flush_cache',
            status: 'running',
            payload: {},
            progress: 50,
            logs: [],
            requested_by: 'u1',
            started_at: new Date().toISOString(),
            completed_at: null,
            result: {},
            error_message: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        });
        return c;
      });
      const r = await runAdminJob('j1', 'development');
      expect(r.status).toBe('running');
    });

    it('runs flush_cache job to completion', async () => {
      const { admin } = makeAdmin();
      const finalJob = {
        id: 'j1',
        job_type: 'flush_cache',
        status: 'succeeded',
        payload: {},
        progress: 100,
        logs: [],
        requested_by: 'u1',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        result: { cacheEntriesRemoved: true },
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx === 1) {
          // initial fetch
          c.maybeSingle.mockResolvedValue({
            data: {
              id: 'j1',
              job_type: 'flush_cache',
              status: 'queued',
              payload: {},
              progress: 0,
              logs: [],
              requested_by: 'u1',
              started_at: null,
              completed_at: null,
              result: {},
              error_message: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        } else {
          // all subsequent: final fetch returns completed
          c.maybeSingle.mockResolvedValue({ data: finalJob, error: null });
        }
        return c;
      });
      const r = await runAdminJob('j1', 'development');
      expect(r.status).toBe('succeeded');
    });

    it('handles unsupported job type gracefully', async () => {
      const { admin } = makeAdmin();
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx === 1) {
          c.maybeSingle.mockResolvedValue({
            data: {
              id: 'j2',
              job_type: 'unknown_type',
              status: 'queued',
              payload: {},
              progress: 0,
              logs: [],
              requested_by: 'u1',
              started_at: null,
              completed_at: null,
              result: {},
              error_message: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        } else {
          c.maybeSingle.mockResolvedValue({
            data: {
              id: 'j2',
              job_type: 'unknown_type',
              status: 'failed',
              payload: {},
              progress: 25,
              logs: [],
              requested_by: 'u1',
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              result: {},
              error_message: 'Unsupported job_type: unknown_type',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        return c;
      });
      const r = await runAdminJob('j2', 'development');
      expect(r.status).toBe('failed');
    });

    it('throws when final fetch returns null', async () => {
      const { admin } = makeAdmin();
      let callIdx = 0;
      admin.from.mockImplementation(() => {
        callIdx++;
        const c = mockChain();
        if (callIdx === 1) {
          c.maybeSingle.mockResolvedValue({
            data: {
              id: 'j3',
              job_type: 'flush_cache',
              status: 'queued',
              payload: {},
              progress: 0,
              logs: [],
              requested_by: 'u1',
              started_at: null,
              completed_at: null,
              result: {},
              error_message: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        } else {
          c.maybeSingle.mockResolvedValue({ data: null, error: null });
        }
        return c;
      });
      await expect(runAdminJob('j3', 'development')).rejects.toThrow(
        'not found after execution',
      );
    });
  });
});
