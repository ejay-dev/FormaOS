import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = membership.organization_id;

    // Fetch data in parallel
    const [
      automationRuns,
      complianceScores,
      tasks,
      evidence,
      upcomingDeadlines,
    ] = await Promise.all([
      // Recent automation runs
      supabase
        .from('automation_runs')
        .select('id, status, created_at, completed_at, metadata')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Compliance scores over time
      supabase
        .from('org_control_evaluations')
        .select('created_at, pass_count, fail_count, total_count')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(30),

      // Task statistics
      supabase
        .from('tasks')
        .select('status, due_date')
        .eq('organization_id', orgId),

      // Evidence count
      supabase
        .from('evidence')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      // Upcoming tasks with deadlines
      supabase
        .from('tasks')
        .select('title, due_date, status')
        .eq('organization_id', orgId)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

    // Calculate compliance score trend
    const scoreHistory = (complianceScores.data || []).map((score: any) => {
      const total = score.total_count || 1;
      const passed = score.pass_count || 0;
      return {
        date: score.created_at,
        score: Math.round((passed / total) * 100),
      };
    }).reverse();

    const latestScore = scoreHistory[scoreHistory.length - 1]?.score || 0;
    const previousScore = scoreHistory[scoreHistory.length - 2]?.score || latestScore;
    const scoreTrend = latestScore - previousScore;

    // Calculate automation stats
    const completedRuns = (automationRuns.data || []).filter(
      (run: any) => run.status === 'completed'
    ).length;
    const totalRuns = automationRuns.data?.length || 0;
    const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

    // Calculate task completion
    const allTasks = tasks.data || [];
    const completedTasks = allTasks.filter((t: any) => t.status === 'completed').length;
    const totalTasks = allTasks.length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate audit readiness
    const evidenceCount = evidence.count || 0;
    const auditReadiness = Math.min(
      100,
      Math.round((latestScore * 0.6) + (taskCompletionRate * 0.3) + (Math.min(evidenceCount / 10, 1) * 10))
    );

    // Calculate risk reductions (based on failed controls trend)
    const recentFailures = scoreHistory.slice(-7).reduce((sum: number, s: any) => sum + (100 - s.score), 0) / 7;
    const olderFailures = scoreHistory.slice(0, 7).reduce((sum: number, s: any) => sum + (100 - s.score), 0) / 7;
    const riskReduction = Math.max(0, Math.round(olderFailures - recentFailures));

    return NextResponse.json({
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
        trend: riskReduction > 0 ? 'improving' : riskReduction < 0 ? 'worsening' : 'stable',
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: taskCompletionRate,
      },
      upcomingDeadlines: (upcomingDeadlines.data || []).map((task: any) => ({
        title: task.title,
        dueDate: task.due_date,
        status: task.status,
      })),
      auditReadiness: {
        score: auditReadiness,
        trend: scoreTrend > 0 ? 'improving' : scoreTrend < 0 ? 'declining' : 'stable',
      },
    });
  } catch (error) {
    console.error('Intelligence summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intelligence summary' },
      { status: 500 }
    );
  }
}
