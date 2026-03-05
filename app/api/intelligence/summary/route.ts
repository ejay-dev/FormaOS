import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  getCachedIntelligence,
  setCachedIntelligence,
  checkRateLimit,
  getRateLimitStatus,
} from '@/lib/cache/intelligence-cache';

const log = routeLog('/api/intelligence/summary');

export async function GET() {
  let supabase;
  let user;
  let orgId: string;

  // TENANT ISOLATION: Get user from session
  try {
    supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Session expired. Please sign in again.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 },
      );
    }

    user = authUser;
  } catch (authError) {
    log.error({ err: authError }, 'Intelligence auth error:');
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Session expired. Please sign in again.',
        code: 'AUTH_ERROR',
      },
      { status: 401 },
    );
  }

  // TENANT ISOLATION: Get organization scoped to this user only
  try {
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      log.error(
        { err: membershipError },
        'Intelligence membership lookup error:',
      );
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Unable to verify organization membership.',
          code: 'ORG_LOOKUP_ERROR',
        },
        { status: 403 },
      );
    }

    if (!membership?.organization_id) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'No organization found. Please contact support.',
          code: 'NO_ORGANIZATION',
        },
        { status: 404 },
      );
    }

    orgId = membership.organization_id;
  } catch (orgError) {
    log.error({ err: orgError }, 'Intelligence organization error:');
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Unable to verify organization membership.',
        code: 'ORG_ERROR',
      },
      { status: 403 },
    );
  }

  // RATE LIMITING: Check if organization is rate limited
  try {
    const rateLimitOk = await checkRateLimit(orgId);
    if (!rateLimitOk) {
      const status = await getRateLimitStatus(orgId);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((status.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': status.resetAt.toString(),
          },
        },
      );
    }
  } catch (rateLimitError) {
    log.warn({ data: rateLimitError }, 'Intelligence rate limit check failed:');
    // Continue without rate limiting if check fails
  }

  // CACHING: Check for cached data
  try {
    const cached = await getCachedIntelligence(orgId);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }
  } catch (cacheError) {
    log.warn({ data: cacheError }, 'Intelligence cache check failed:');
    // Continue without cache if check fails
  }

  // DATA FETCHING: Fetch intelligence data
  try {
    // TENANT ISOLATION: All queries explicitly scoped by organization_id
    // Fetch data in parallel
    const [
      automationRuns,
      complianceScores,
      tasks,
      evidence,
      upcomingDeadlines,
    ] = await Promise.all([
      // Recent automation runs - SCOPED by orgId
      supabase
        .from('automation_runs')
        .select('id, status, created_at, completed_at, metadata')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Compliance scores over time - SCOPED by orgId
      supabase
        .from('org_control_evaluations')
        .select('created_at, pass_count, fail_count, total_count')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(30),

      // Task statistics - SCOPED by orgId
      supabase
        .from('tasks')
        .select('status, due_date')
        .eq('organization_id', orgId),

      // Evidence count - SCOPED by orgId
      supabase
        .from('evidence')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      // Upcoming tasks with deadlines - SCOPED by orgId
      supabase
        .from('tasks')
        .select('title, due_date, status')
        .eq('organization_id', orgId)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

    // Calculate compliance score trend
    const scoreHistory = (complianceScores.data || [])
      .map((score: Record<string, unknown>) => {
        const total = Number(score.total_count) || 1;
        const passed = Number(score.pass_count) || 0;
        return {
          date: score.created_at,
          score: Math.round((passed / total) * 100),
        };
      })
      .reverse();

    const latestScore = scoreHistory[scoreHistory.length - 1]?.score || 0;
    const previousScore =
      scoreHistory[scoreHistory.length - 2]?.score || latestScore;
    const scoreTrend = latestScore - previousScore;

    // Calculate automation stats
    const completedRuns = (automationRuns.data || []).filter(
      (run: Record<string, unknown>) => run.status === 'completed',
    ).length;
    const totalRuns = automationRuns.data?.length || 0;
    const successRate =
      totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

    // Calculate task completion
    const allTasks = tasks.data || [];
    const completedTasks = allTasks.filter(
      (t: Record<string, unknown>) => t.status === 'completed',
    ).length;
    const totalTasks = allTasks.length;
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate audit readiness
    const evidenceCount = evidence.count || 0;
    const auditReadiness = Math.min(
      100,
      Math.round(
        latestScore * 0.6 +
          taskCompletionRate * 0.3 +
          Math.min(evidenceCount / 10, 1) * 10,
      ),
    );

    // Calculate risk reductions (based on failed controls trend)
    const recentFailures =
      scoreHistory
        .slice(-7)
        .reduce(
          (sum: number, s: Record<string, unknown>) =>
            sum + (100 - (s.score as number)),
          0,
        ) / 7;
    const olderFailures =
      scoreHistory
        .slice(0, 7)
        .reduce(
          (sum: number, s: Record<string, unknown>) =>
            sum + (100 - (s.score as number)),
          0,
        ) / 7;
    const riskReduction = Math.max(
      0,
      Math.round(olderFailures - recentFailures),
    );

    const responseData = {
      complianceScore: {
        current: latestScore,
        trend: scoreTrend,
        history: scoreHistory.slice(-14), // Last 14 data points
      },
      automation: {
        totalRuns: totalRuns,
        completedRuns: completedRuns,
        successRate: successRate,
        lastRunAt: automationRuns.data?.[0]?.created_at || null,
      },
      riskReduction: {
        percentage: riskReduction,
        trend:
          riskReduction > 0
            ? 'improving'
            : riskReduction < 0
              ? 'worsening'
              : 'stable',
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: taskCompletionRate,
      },
      upcomingDeadlines: (upcomingDeadlines.data || []).map(
        (task: Record<string, unknown>) => ({
          title: task.title,
          dueDate: task.due_date,
          status: task.status,
        }),
      ),
      auditReadiness: {
        score: auditReadiness,
        trend:
          scoreTrend > 0
            ? 'improving'
            : scoreTrend < 0
              ? 'declining'
              : 'stable',
      },
    };

    // CACHING: Store in cache
    try {
      await setCachedIntelligence(orgId, responseData);
    } catch (cacheError) {
      log.warn({ data: cacheError }, 'Intelligence cache set failed:');
      // Continue even if caching fails
    }

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
      },
    });
  } catch (dataError) {
    log.error({ err: dataError }, 'Intelligence data fetching error:');
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Unable to fetch intelligence data. Please try again later.',
        code: 'DATA_FETCH_ERROR',
      },
      { status: 500 },
    );
  }
}
