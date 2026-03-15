import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { getLatestAssessment } from '@/lib/soc2/readiness-engine';
import { routeLog } from '@/lib/monitoring/server-logger';

/**
 * =========================================================
 * REST API v1 - SOC 2 Readiness Endpoint
 * =========================================================
 * GET /api/v1/soc2/readiness - Get SOC 2 readiness score and domain breakdown
 *
 * Authentication: Bearer token (Supabase JWT)
 * Rate limit: 60 requests per minute
 */

const log = routeLog('/api/v1/soc2/readiness');

export async function GET(request: Request) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimitApi(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
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

    // 3. Fetch latest readiness assessment
    const assessment = await getLatestAssessment(permissionCtx.orgId);

    if (!assessment) {
      return NextResponse.json({
        organizationId: permissionCtx.orgId,
        assessment: null,
        message: 'No SOC 2 readiness assessment found. Run an assessment first.',
        lastUpdated: new Date().toISOString(),
      });
    }

    // 4. Return formatted response
    return NextResponse.json({
      organizationId: permissionCtx.orgId,
      overallScore: assessment.overallScore,
      totalControls: assessment.totalControls,
      satisfiedControls: assessment.satisfiedControls,
      domainScores: assessment.domainScores,
      controlResults: assessment.controlResults,
      assessedAt: assessment.assessedAt,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: unknown) {
    log.error({ err: error }, '[API v1 /soc2/readiness] Unexpected error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
