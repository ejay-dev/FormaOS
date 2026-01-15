import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';

/**
 * =========================================================
 * REST API v1 - Tasks Endpoint
 * =========================================================
 * GET /api/v1/tasks - List user's assigned tasks
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

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // 4. Fetch tasks
    let query = supabase
      .from('org_tasks')
      .select(
        'id, title, description, status, priority, due_date, assigned_to, created_at, updated_at',
      )
      .eq('organization_id', permissionCtx.orgId)
      .eq('assigned_to', user.id)
      .order('due_date', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('[API v1 /tasks] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 },
      );
    }

    // 5. Return formatted response
    return NextResponse.json({
      tasks: tasks || [],
      total: tasks?.length || 0,
      limit,
      status: status || 'all',
      priority: priority || 'all',
    });
  } catch (error: any) {
    console.error('[API v1 /tasks] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
