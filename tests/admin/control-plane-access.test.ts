/** @jest-environment node */

jest.mock('@/app/app/admin/access', () => ({
  requireFounderAccess: jest.fn(),
}));

jest.mock('@/lib/control-plane/server', () => ({
  getAdminControlPlaneSnapshot: jest.fn(),
  enqueueAdminJob: jest.fn(),
  runAdminJob: jest.fn(),
  upsertFeatureFlag: jest.fn(),
  upsertMarketingConfig: jest.fn(),
  upsertSystemSetting: jest.fn(),
  writeControlPlaneAudit: jest.fn(),
  resolveControlPlaneEnvironment: jest.fn(() => 'production'),
}));

import { GET, POST } from '@/app/api/admin/control-plane/route';
import { requireFounderAccess } from '@/app/app/admin/access';
import { getAdminControlPlaneSnapshot } from '@/lib/control-plane/server';

describe('/api/admin/control-plane permissions', () => {
  const requireFounderAccessMock = requireFounderAccess as jest.Mock;
  const getAdminSnapshotMock = getAdminControlPlaneSnapshot as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns 403 for non-founder requests', async () => {
    requireFounderAccessMock.mockRejectedValue(new Error('Forbidden'));

    const response = await GET(new Request('http://localhost/api/admin/control-plane'));

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.error).toBe('Unavailable (permission)');
  });

  it('GET returns snapshot for founders', async () => {
    requireFounderAccessMock.mockResolvedValue({
      user: { id: 'founder-1', email: 'founder@example.com' },
    });

    getAdminSnapshotMock.mockResolvedValue({
      environment: 'production',
      runtimeVersion: '1',
      featureFlags: [],
      marketingConfig: [],
      systemSettings: [],
      integrations: [],
      jobs: [],
      audit: [],
      health: {
        databaseLatencyMs: 10,
        apiHealthy: true,
        queue: {
          queued: 0,
          running: 0,
          failed: 0,
          succeededLast24h: 0,
        },
      },
    });

    const response = await GET(new Request('http://localhost/api/admin/control-plane'));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.environment).toBe('production');
    expect(getAdminSnapshotMock).toHaveBeenCalled();
  });

  it('POST blocks unauthorized callers', async () => {
    requireFounderAccessMock.mockRejectedValue(new Error('Forbidden'));

    const response = await POST(
      new Request('http://localhost/api/admin/control-plane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_system_setting', payload: {} }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it('POST returns 400 for unknown actions', async () => {
    requireFounderAccessMock.mockResolvedValue({
      user: { id: 'founder-1', email: 'founder@example.com' },
    });

    const response = await POST(
      new Request('http://localhost/api/admin/control-plane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unknown_action', payload: {} }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(String(payload.error)).toContain('Unknown action');
  });
});
