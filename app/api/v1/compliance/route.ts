import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { getDashboardMetrics } from '@/lib/data/analytics';

/**
 * =========================================================
 * REST API v1 - Compliance Endpoint
 * =========================================================
 * GET /api/v1/compliance - Get organization compliance metrics
 *
 * Authentication: Bearer token (Supabase JWT)
 * Rate limit: 60 requests per minute
 */

export async function GET(request: Request) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimitApi(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.reset },
        { status: 429 },
      );
    }

    // 2. Authentication & authorization
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 },
      );
    }

    const permissionCtx = await requirePermission('VIEW_CONTROLS');
    if (!permissionCtx) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 },
      );
    }

    // 3. Fetch compliance metrics
    const metrics = await getDashboardMetrics(permissionCtx.orgId);

    // 4. Return formatted response
    return NextResponse.json({
      organizationId: permissionCtx.orgId,
      complianceScore: metrics.complianceScore,
      riskLevel: metrics.riskLevel,
      complianceTrend: metrics.complianceTrend,
      policies: {
        total: metrics.totalPolicies,
        active: metrics.activePolicies,
        coverageRate: metrics.policyCoverageRate,
      },
      tasks: {
        total: metrics.totalTasks,
        completed: metrics.completedTasks,
        pending: metrics.pendingTasks,
        overdue: metrics.overdueTasks,
        completionRate: metrics.taskCompletionRate,
      },
      evidence: {
        collected: metrics.evidenceCollected,
        required: metrics.evidenceRequired,
        completionRate: metrics.evidenceCompletionRate,
      },
      anomalies: metrics.anomalies,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API v1 /compliance] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
