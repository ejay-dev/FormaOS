/** @jest-environment node */
/**
 * Tests for app/api/v1/compliance/route.ts
 * Tests: GET handler for compliance metrics.
 */

const mockGetUser = jest.fn();
const mockRateLimitApi = jest.fn();
const mockRequirePermission = jest.fn();
const mockGetDashboardMetrics = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  __esModule: true,
  createSupabaseServerClient: jest.fn(() =>
    Promise.resolve({ auth: { getUser: (...a: any[]) => mockGetUser(...a) } }),
  ),
}));

jest.mock('@/app/app/actions/rbac', () => ({
  requirePermission: (...a: any[]) => mockRequirePermission(...a),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimitApi: (...a: any[]) => mockRateLimitApi(...a),
}));

jest.mock('@/lib/data/analytics', () => ({
  getDashboardMetrics: (...a: any[]) => mockGetDashboardMetrics(...a),
}));

jest.mock('@/lib/monitoring/server-logger', () => ({
  routeLog: () => jest.fn(),
}));

import { GET } from '@/app/api/v1/compliance/route';

describe('GET /api/v1/compliance', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockRateLimitApi.mockReset();
    mockRequirePermission.mockReset();
    mockGetDashboardMetrics.mockReset();

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u-1' } },
      error: null,
    });
    mockRateLimitApi.mockResolvedValue({ success: true });
    mockRequirePermission.mockResolvedValue({ orgId: 'org-1', userId: 'u-1' });
    mockGetDashboardMetrics.mockResolvedValue({
      complianceScore: 85,
      riskLevel: 'low',
      complianceTrend: 'improving',
      totalPolicies: 20,
      activePolicies: 18,
      policyCoverageRate: 0.9,
      totalTasks: 50,
      completedTasks: 40,
      pendingTasks: 8,
      overdueTasks: 2,
      taskCompletionRate: 0.8,
      evidenceCollected: 100,
      evidenceRequired: 120,
      evidenceCompletionRate: 0.83,
      anomalies: [],
    });
  });

  it('returns compliance metrics on success', async () => {
    const request = new Request('http://localhost/api/v1/compliance');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.complianceScore).toBe(85);
    expect(body.riskLevel).toBe('low');
    expect(body).toHaveProperty('policies');
    expect(body).toHaveProperty('tasks');
    expect(body).toHaveProperty('evidence');
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimitApi.mockResolvedValueOnce({
      success: false,
      resetAt: Date.now() + 60000,
    });

    const request = new Request('http://localhost/api/v1/compliance');
    const response = await GET(request);
    expect(response.status).toBe(429);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const request = new Request('http://localhost/api/v1/compliance');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('returns 403 when insufficient permissions', async () => {
    mockRequirePermission.mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/v1/compliance');
    const response = await GET(request);
    expect(response.status).toBe(403);
  });
});
