import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';

/**
 * =========================================================
 * REST API v1 - Audit Logs Endpoint
 * =========================================================
 * GET /api/v1/audit-logs - List audit log entries
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

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    // 4. Fetch audit logs
    let query = supabase
      .from('org_audit_logs')
      .select(
        'id, action, target, actor_email, domain, severity, metadata, created_at',
      )
      .eq('organization_id', permissionCtx.orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq('action', action);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('[API v1 /audit-logs] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 },
      );
    }

    // 5. Return formatted response
    return NextResponse.json({
      logs: logs || [],
      total: logs?.length || 0,
      limit,
      filters: {
        action: action || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error: any) {
    console.error('[API v1 /audit-logs] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
