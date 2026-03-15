import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { generateSoc2Report } from '@/lib/soc2/report-generator';
import { getLatestAssessment, getAssessmentHistory } from '@/lib/soc2/readiness-engine';
import { getMilestones } from '@/lib/soc2/milestone-tracker';
import { routeLog } from '@/lib/monitoring/server-logger';

/**
 * =========================================================
 * REST API v1 - SOC 2 Report Endpoint
 * =========================================================
 * GET  /api/v1/soc2/report - Get the latest certification report data
 * POST /api/v1/soc2/report - Generate a new certification report
 *
 * Authentication: Bearer token (Supabase JWT)
 * Permission: GENERATE_CERTIFICATIONS
 * Rate limit: 60 requests per minute
 */

const log = routeLog('/api/v1/soc2/report');

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

    const permissionCtx = await requirePermission('GENERATE_CERTIFICATIONS');
    if (!permissionCtx) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 },
      );
    }

    const orgId = permissionCtx.orgId;

    // 3. Fetch latest assessment + milestones + history
    const [assessment, milestones, scoreHistory] = await Promise.all([
      getLatestAssessment(orgId),
      getMilestones(orgId),
      getAssessmentHistory(orgId, 10),
    ]);

    // Get organization name
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .maybeSingle();

    const organizationName =
      (orgRow as Record<string, unknown> | null)?.name as string ??
      'Unknown Organization';

    if (!assessment) {
      return NextResponse.json({
        organizationId: orgId,
        organizationName,
        report: null,
        message: 'No SOC 2 assessment found. Run an assessment or generate a report first.',
        lastUpdated: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      organizationId: orgId,
      organizationName,
      overallScore: assessment.overallScore,
      domainScores: assessment.domainScores,
      controlResults: assessment.controlResults,
      milestones,
      scoreHistory,
      assessedAt: assessment.assessedAt,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: unknown) {
    log.error({ err: error }, '[API v1 /soc2/report] GET unexpected error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const permissionCtx = await requirePermission('GENERATE_CERTIFICATIONS');
    if (!permissionCtx) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 },
      );
    }

    // 3. Generate full report
    const report = await generateSoc2Report(permissionCtx.orgId);

    return NextResponse.json(
      {
        organizationId: permissionCtx.orgId,
        report,
        generatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    log.error({ err: error }, '[API v1 /soc2/report] POST unexpected error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
