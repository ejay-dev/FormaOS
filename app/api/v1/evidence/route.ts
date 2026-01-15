import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';

/**
 * =========================================================
 * REST API v1 - Evidence Endpoint
 * =========================================================
 * GET /api/v1/evidence - List evidence artifacts
 *
 * Authentication: Bearer token (Supabase JWT)
 * Rate limit: 100 requests per minute
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

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const taskId = searchParams.get('taskId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // 4. Fetch evidence
    let query = supabase
      .from('org_evidence')
      .select(
        'id, title, file_name, file_type, file_size, verification_status, uploaded_by, verified_by, verified_at, task_id, created_at',
      )
      .eq('organization_id', permissionCtx.orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('verification_status', status);
    }

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data: evidence, error } = await query;

    if (error) {
      console.error('[API v1 /evidence] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch evidence' },
        { status: 500 },
      );
    }

    // 5. Return formatted response
    return NextResponse.json({
      evidence: evidence || [],
      total: evidence?.length || 0,
      limit,
      status: status || 'all',
      taskId: taskId || null,
    });
  } catch (error: any) {
    console.error('[API v1 /evidence] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
