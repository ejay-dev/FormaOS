import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateAuditForecast } from '@/lib/executive/multi-framework-rollup';
import { getDeadlineSummary, getActionRequiredDeadlines } from '@/lib/executive/deadline-tracker';
import type { AuditReadinessForecast, AutomationMetrics } from '@/lib/executive/types';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/executive/audit-forecast
 * Returns audit readiness forecast and automation metrics
 * Restricted to owner/admin roles
 */
export async function GET(request: NextRequest) {
  let supabase;
  let userId: string;
  let orgId: string;

  // Get optional framework filter from query params
  const searchParams = request.nextUrl.searchParams;
  const frameworkCode = searchParams.get('framework') || undefined;

  // TENANT ISOLATION: Authenticate user
  try {
    supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Session expired. Please sign in again.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    userId = user.id;
  } catch (authError) {
    console.error('[Audit Forecast] Auth error:', authError);
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication failed.',
        code: 'AUTH_ERROR',
      },
      { status: 401 }
    );
  }

  // TENANT ISOLATION: Get organization and verify role
  try {
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError || !membership?.organization_id) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Organization membership not found.',
          code: 'ORG_NOT_FOUND',
        },
        { status: 403 }
      );
    }

    // Check for executive-level role (owner or admin)
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Executive dashboard requires admin access.',
          code: 'ADMIN_REQUIRED',
        },
        { status: 403 }
      );
    }

    orgId = membership.organization_id;
  } catch (orgError) {
    console.error('[Audit Forecast] Org lookup error:', orgError);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to lookup organization.',
        code: 'ORG_LOOKUP_ERROR',
      },
      { status: 500 }
    );
  }

  try {
    // Calculate audit forecast
    const auditForecast: AuditReadinessForecast = await calculateAuditForecast(
      orgId,
      frameworkCode
    );

    // Get automation metrics
    const automationMetrics = await getAutomationMetrics(orgId);

    // Get deadline summary
    const deadlineSummary = await getDeadlineSummary(orgId);

    // Get action-required deadlines
    const actionDeadlines = await getActionRequiredDeadlines(orgId, 5);

    return NextResponse.json({
      auditForecast,
      automationMetrics,
      deadlineSummary,
      actionDeadlines,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Audit Forecast] Calculation error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to calculate audit forecast.',
        code: 'CALCULATION_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate automation metrics for the organization
 */
async function getAutomationMetrics(orgId: string): Promise<AutomationMetrics> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get workflows
  const { data: workflows } = await admin
    .from('org_workflows')
    .select('id, status')
    .eq('organization_id', orgId);

  const totalWorkflows = workflows?.length || 0;
  const activeWorkflows = workflows?.filter((w: { status: string }) => w.status === 'active').length || 0;

  // Get workflow triggers this week
  const { count: triggersThisWeek } = await admin
    .from('org_workflow_runs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('triggered_at', sevenDaysAgo.toISOString());

  // Get workflow triggers this month
  const { count: triggersThisMonth } = await admin
    .from('org_workflow_runs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('triggered_at', thirtyDaysAgo.toISOString());

  // Get workflow success rate
  const { data: recentRuns } = await admin
    .from('org_workflow_runs')
    .select('status')
    .eq('organization_id', orgId)
    .gte('triggered_at', thirtyDaysAgo.toISOString())
    .limit(100);

  const successfulRuns = recentRuns?.filter((r: { status: string }) => r.status === 'completed').length || 0;
  const successRate =
    recentRuns && recentRuns.length > 0
      ? Math.round((successfulRuns / recentRuns.length) * 100)
      : 100;

  // Get task auto-completion rate
  const { data: tasks } = await admin
    .from('org_tasks')
    .select('completed_by_workflow')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('completed_at', thirtyDaysAgo.toISOString())
    .limit(100);

  const autoCompletedTasks = tasks?.filter((t: { completed_by_workflow?: boolean }) => t.completed_by_workflow).length || 0;
  const taskAutoCompletionRate =
    tasks && tasks.length > 0
      ? Math.round((autoCompletedTasks / tasks.length) * 100)
      : 0;

  // Get average resolution time (days)
  const { data: completedTasks } = await admin
    .from('org_tasks')
    .select('created_at, completed_at')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .gte('completed_at', thirtyDaysAgo.toISOString())
    .limit(100);

  let totalResolutionDays = 0;
  for (const task of completedTasks || []) {
    const created = new Date(task.created_at);
    const completed = new Date(task.completed_at);
    totalResolutionDays += (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  }
  const averageResolutionTime =
    completedTasks && completedTasks.length > 0
      ? Math.round((totalResolutionDays / completedTasks.length) * 10) / 10
      : 0;

  return {
    totalWorkflows,
    activeWorkflows,
    triggersThisWeek: triggersThisWeek || 0,
    triggersThisMonth: triggersThisMonth || 0,
    successRate,
    taskAutoCompletionRate,
    averageResolutionTime,
  };
}
