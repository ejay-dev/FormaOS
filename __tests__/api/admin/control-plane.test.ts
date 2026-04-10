/**
 * @jest-environment node
 */

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */
jest.mock('server-only', () => ({}));

const mockRequireAdminAccess = jest.fn();
jest.mock('@/app/app/admin/access', () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockExtractAdminReason = jest.fn(() => 'test reason');
const mockHandleAdminError = jest.fn(
  (err: any) =>
    new Response(JSON.stringify({ error: err?.message ?? 'error' }), {
      status: 500,
    }),
);
const mockRequireAdminChangeControl = jest.fn(() => 'approved');
jest.mock('@/app/api/admin/_helpers', () => ({
  extractAdminReason: (...args: any[]) =>
    (mockExtractAdminReason as any)(...args),
  handleAdminError: (...args: any[]) => (mockHandleAdminError as any)(...args),
  requireAdminChangeControl: (...args: any[]) =>
    (mockRequireAdminChangeControl as any)(...args),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('@/lib/security/csrf', () => ({
  validateCsrfOrigin: jest.fn(() => null),
}));

jest.mock('@/lib/ratelimit', () => ({
  checkAdminRateLimit: jest.fn().mockResolvedValue({ success: true }),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

const mockGetSnapshot = jest.fn();
const mockUpsertFeatureFlag = jest.fn();
const mockUpsertMarketingConfig = jest.fn();
const mockUpsertSystemSetting = jest.fn();
const mockEnqueueAdminJob = jest.fn();
const mockRunAdminJob = jest.fn();
const mockWriteAudit = jest.fn();
const mockResolveEnv = jest.fn(() => 'production');

jest.mock('@/lib/control-plane/server', () => ({
  getAdminControlPlaneSnapshot: (...args: any[]) => mockGetSnapshot(...args),
  upsertFeatureFlag: (...args: any[]) =>
    (mockUpsertFeatureFlag as any)(...args),
  upsertMarketingConfig: (...args: any[]) =>
    (mockUpsertMarketingConfig as any)(...args),
  upsertSystemSetting: (...args: any[]) =>
    (mockUpsertSystemSetting as any)(...args),
  enqueueAdminJob: (...args: any[]) => (mockEnqueueAdminJob as any)(...args),
  runAdminJob: (...args: any[]) => (mockRunAdminJob as any)(...args),
  writeControlPlaneAudit: (...args: any[]) => (mockWriteAudit as any)(...args),
  resolveControlPlaneEnvironment: (...args: any[]) =>
    (mockResolveEnv as any)(...args),
}));

import { GET, POST } from '@/app/api/admin/control-plane/route';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function makeRequest(method: string, body?: Record<string, unknown>) {
  const url = 'https://app.test/api/admin/control-plane';
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) init.body = JSON.stringify(body);
  return new Request(url, init);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('admin/control-plane route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue({ user: { id: 'u1' } });
    mockGetSnapshot.mockResolvedValue({
      featureFlags: [],
      integrations: [],
      systemSettings: [],
    });
    mockUpsertFeatureFlag.mockResolvedValue({ id: 'ff-1' });
    mockUpsertMarketingConfig.mockResolvedValue({ id: 'mc-1' });
    mockUpsertSystemSetting.mockResolvedValue({ id: 'ss-1' });
    mockEnqueueAdminJob.mockResolvedValue({ id: 'job-1' });
    mockRunAdminJob.mockResolvedValue({ id: 'job-1', status: 'completed' });
    mockWriteAudit.mockResolvedValue(undefined);
  });

  /* ---------- GET ---------- */
  describe('GET', () => {
    it('returns control plane snapshot', async () => {
      mockGetSnapshot.mockResolvedValue({ featureFlags: [{ key: 'ff1' }] });
      const res = await GET(makeRequest('GET'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.featureFlags).toHaveLength(1);
    });

    it('returns error on access failure', async () => {
      mockRequireAdminAccess.mockRejectedValue(new Error('forbidden'));
      const _res = await GET(makeRequest('GET'));
      expect(mockHandleAdminError).toHaveBeenCalled();
    });
  });

  /* ---------- POST – set_feature_flag ---------- */
  describe('POST set_feature_flag', () => {
    it('creates feature flag', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_feature_flag',
          payload: { flagKey: 'dark_mode', enabled: true },
        }),
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(mockUpsertFeatureFlag).toHaveBeenCalled();
      expect(mockWriteAudit).toHaveBeenCalled();
    });

    it('returns 400 for missing flagKey', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_feature_flag',
          payload: { enabled: true },
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid scopeType', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_feature_flag',
          payload: { flagKey: 'x', scopeType: 'invalid' },
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 when scopeId missing for org scope', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_feature_flag',
          payload: { flagKey: 'x', scopeType: 'organization' },
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  /* ---------- POST – set_marketing_config ---------- */
  describe('POST set_marketing_config', () => {
    it('creates marketing config', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_marketing_config',
          payload: { section: 'hero', configKey: 'title', value: 'Welcome' },
        }),
      );
      expect(res.status).toBe(200);
      expect(mockUpsertMarketingConfig).toHaveBeenCalled();
    });

    it('returns 400 for missing section/configKey', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_marketing_config',
          payload: { section: '', configKey: '' },
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  /* ---------- POST – set_system_setting ---------- */
  describe('POST set_system_setting', () => {
    it('creates system setting', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_system_setting',
          payload: {
            category: 'security',
            settingKey: 'mfa_required',
            value: true,
          },
        }),
      );
      expect(res.status).toBe(200);
      expect(mockUpsertSystemSetting).toHaveBeenCalled();
    });

    it('returns 400 for missing category/settingKey', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_system_setting',
          payload: { category: '', settingKey: '' },
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  /* ---------- POST – set_integration_control ---------- */
  describe('POST set_integration_control', () => {
    it('updates integration control', async () => {
      mockGetSnapshot.mockResolvedValue({
        integrations: [
          {
            key: 'slack',
            value: {
              enabled: true,
              connection_status: 'connected',
              error_logs: [],
            },
          },
        ],
      });
      const res = await POST(
        makeRequest('POST', {
          action: 'set_integration_control',
          payload: { integrationKey: 'slack', value: { enabled: false } },
        }),
      );
      expect(res.status).toBe(200);
    });

    it('returns 400 for missing integrationKey', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'set_integration_control',
          payload: {},
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  /* ---------- POST – retry_integration ---------- */
  describe('POST retry_integration', () => {
    it('retries integration', async () => {
      mockGetSnapshot.mockResolvedValue({
        integrations: [
          {
            key: 'teams',
            value: {
              enabled: true,
              connection_status: 'error',
              error_logs: [],
            },
          },
        ],
      });
      const res = await POST(
        makeRequest('POST', {
          action: 'retry_integration',
          payload: { integrationKey: 'teams' },
        }),
      );
      expect(res.status).toBe(200);
    });

    it('returns 400 for missing integrationKey', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'retry_integration',
          payload: {},
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  /* ---------- POST – enqueue_job / run_job ---------- */
  describe('POST enqueue_job & run_job', () => {
    it('enqueues job', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'enqueue_job',
          payload: { jobType: 'reconcile', payload: { orgId: 'org-1' } },
        }),
      );
      expect(res.status).toBe(200);
      expect(mockEnqueueAdminJob).toHaveBeenCalled();
    });

    it('returns 400 for empty jobType', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'enqueue_job',
          payload: { jobType: '' },
        }),
      );
      expect(res.status).toBe(400);
    });

    it('runs existing job', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'run_job',
          payload: { jobId: 'job-1' },
        }),
      );
      expect(res.status).toBe(200);
      expect(mockRunAdminJob).toHaveBeenCalledWith('job-1', 'production');
    });

    it('returns 400 for empty jobId', async () => {
      const res = await POST(
        makeRequest('POST', {
          action: 'run_job',
          payload: { jobId: '' },
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  /* ---------- POST – unknown action ---------- */
  it('returns 400 for unknown action', async () => {
    const res = await POST(
      makeRequest('POST', { action: 'do_magic', payload: {} }),
    );
    expect(res.status).toBe(400);
  });

  /* ---------- POST – missing action ---------- */
  it('returns 400 when action is empty', async () => {
    const res = await POST(makeRequest('POST', { payload: {} }));
    expect(res.status).toBe(400);
  });

  /* ---------- POST – rate limiting ---------- */
  it('returns 429 when rate limited', async () => {
    const { checkAdminRateLimit } = require('@/lib/ratelimit');
    checkAdminRateLimit.mockResolvedValueOnce({ success: false });
    const res = await POST(
      makeRequest('POST', {
        action: 'set_feature_flag',
        payload: { flagKey: 'x' },
      }),
    );
    expect(res.status).toBe(429);
  });

  /* ---------- POST – CSRF failure ---------- */
  it('returns CSRF error response', async () => {
    const { validateCsrfOrigin } = require('@/lib/security/csrf');
    validateCsrfOrigin.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }),
    );
    const res = await POST(makeRequest('POST', { action: 'test' }));
    expect(res.status).toBe(403);
  });
});
