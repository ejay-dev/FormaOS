/**
 * Executive Posture Calculator
 * Aggregates organization-wide compliance posture for C-level visibility
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { calculateFrameworkReadiness } from '@/lib/audit/readiness-calculator';
import type {
  ExecutivePosture,
  CriticalControl,
  ComplianceDeadline,
  FrameworkRollupItem,
} from './types';

/**
 * Calculate overall executive compliance posture
 */
export async function calculateExecutivePosture(
  orgId: string
): Promise<ExecutivePosture> {
  const admin = createSupabaseAdminClient();

  // Get framework readiness scores
  const frameworkReadiness = await calculateFrameworkReadiness(orgId);

  // Calculate weighted average score
  const totalWeight = frameworkReadiness.reduce((sum, fw) => sum + fw.totalControls, 0);
  const weightedScore =
    totalWeight > 0
      ? Math.round(
          frameworkReadiness.reduce(
            (sum, fw) => sum + fw.readinessScore * fw.totalControls,
            0
          ) / totalWeight
        )
      : 0;

  // Get previous score from snapshots for trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: previousSnapshots } = await admin
    .from('org_compliance_snapshots')
    .select('compliance_score')
    .eq('organization_id', orgId)
    .lte('captured_at', thirtyDaysAgo.toISOString())
    .order('captured_at', { ascending: false })
    .limit(1);

  const previousScore = previousSnapshots?.[0]?.compliance_score ?? weightedScore;
  const trendPercentage = previousScore > 0 ? weightedScore - previousScore : 0;
  const trend: 'up' | 'down' | 'stable' =
    trendPercentage > 2 ? 'up' : trendPercentage < -2 ? 'down' : 'stable';

  // Calculate framework coverage (frameworks with >0 controls mapped)
  const frameworksWithCoverage = frameworkReadiness.filter(
    (fw) => fw.satisfiedControls > 0
  ).length;
  const frameworkCoverage =
    frameworkReadiness.length > 0
      ? Math.round((frameworksWithCoverage / frameworkReadiness.length) * 100)
      : 0;

  // Calculate automation effectiveness
  const { data: workflows } = await admin
    .from('org_workflows')
    .select('id, status')
    .eq('organization_id', orgId);

  const { count: workflowTriggers } = await admin
    .from('org_workflow_runs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('triggered_at', thirtyDaysAgo.toISOString());

  const activeWorkflows = workflows?.filter((w: { status?: string }) => w.status === 'active').length || 0;
  const automationEffectiveness =
    activeWorkflows > 0 ? Math.min(100, Math.round((workflowTriggers || 0) / activeWorkflows) * 10) : 0;

  // Get critical control failures
  const criticalFailures = await getCriticalControlFailures(orgId, admin);

  // Get upcoming deadlines
  const upcomingDeadlines = await getUpcomingDeadlines(orgId, admin);

  // Build framework rollup
  const frameworkRollup: FrameworkRollupItem[] = frameworkReadiness.map((fw) => ({
    frameworkId: fw.frameworkId,
    code: fw.frameworkCode,
    title: fw.frameworkTitle,
    readinessScore: fw.readinessScore,
    controlsTotal: fw.totalControls,
    controlsSatisfied: fw.satisfiedControls,
    controlsPartial: fw.partialControls,
    controlsMissing: fw.missingControls,
    trend: 0,
    trendDirection: 'stable' as const,
    weight: fw.totalControls,
    lastEvaluated: fw.evaluatedAt ?? undefined,
  }));

  return {
    overallScore: weightedScore,
    previousScore,
    trend,
    trendPercentage: Math.abs(trendPercentage),
    frameworkCoverage,
    automationEffectiveness,
    criticalFailures,
    upcomingDeadlines,
    frameworkRollup,
    lastEvaluated: new Date().toISOString(),
  };
}

/**
 * Get critical control failures (controls with score < 50%)
 */
async function getCriticalControlFailures(
  orgId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>
): Promise<CriticalControl[]> {
  const { data: evaluations } = await admin
    .from('org_control_evaluations')
    .select(`
      id,
      control_id,
      framework_id,
      compliance_score,
      last_evaluated_at,
      gap_description,
      evidence_count,
      required_evidence
    `)
    .eq('organization_id', orgId)
    .eq('control_type', 'control_snapshot')
    .lt('compliance_score', 50)
    .order('compliance_score', { ascending: true })
    .limit(10);

  if (!evaluations?.length) return [];

  // Get control details
  const controlIds = evaluations.map((e: { control_id?: string }) => e.control_id).filter(Boolean) as string[];
  const { data: controls } = await admin
    .from('compliance_controls')
    .select('id, code, title, framework_id')
    .in('id', controlIds);

  const controlMap = new Map<string, { id: string; code: string; title: string; framework_id?: string }>(
    controls?.map((c: { id: string; code: string; title: string; framework_id?: string }) => [c.id, c]) || []
  );

  // Get framework codes
  const frameworkIds = [...new Set(evaluations.map((e: { framework_id?: string }) => e.framework_id).filter(Boolean))] as string[];
  const { data: frameworks } = await admin
    .from('compliance_frameworks')
    .select('id, code, title')
    .in('id', frameworkIds);

  const frameworkMap = new Map<string, { id: string; code: string; title: string }>(
    frameworks?.map((f: { id: string; code: string; title: string }) => [f.id, f]) || []
  );

  return evaluations.map((eval_: { id: string; control_id: string; framework_id: string; compliance_score?: number; last_evaluated_at?: string; gap_description?: string; evidence_count?: number; required_evidence?: number }) => {
    const control = controlMap.get(eval_.control_id);
    const framework = frameworkMap.get(eval_.framework_id);
    const score = eval_.compliance_score ?? 0;

    return {
      id: eval_.id,
      controlCode: control?.code || 'UNKNOWN',
      title: control?.title || 'Unknown Control',
      framework: framework?.title || 'Unknown Framework',
      frameworkCode: framework?.code || 'UNKNOWN',
      status: score < 25 ? 'critical' : score < 40 ? 'high' : 'medium',
      dueDate: undefined,
      lastEvaluated: eval_.last_evaluated_at,
      gapDescription: eval_.gap_description ?? undefined,
      evidenceCount: eval_.evidence_count ?? 0,
      requiredEvidence: eval_.required_evidence ?? 1,
    } as CriticalControl;
  });
}

/**
 * Get upcoming compliance deadlines
 */
async function getUpcomingDeadlines(
  orgId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>
): Promise<ComplianceDeadline[]> {
  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const { data: deadlines } = await admin
    .from('org_compliance_deadlines')
    .select('*')
    .eq('organization_id', orgId)
    .gte('due_date', now.toISOString().split('T')[0])
    .lte('due_date', ninetyDaysFromNow.toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(10);

  return (deadlines || []).map((d: { id: string; title: string; description?: string | null; framework_slug?: string | null; due_date: string; reminder_date?: string | null; deadline_type: string }) => {
    const dueDate = new Date(d.due_date);
    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: d.id,
      title: d.title,
      description: d.description ?? undefined,
      framework: d.framework_slug ?? undefined,
      frameworkSlug: d.framework_slug ?? undefined,
      dueDate: d.due_date,
      reminderDate: d.reminder_date ?? undefined,
      type: d.deadline_type as ComplianceDeadline['type'],
      priority: daysRemaining <= 7 ? 'critical' : daysRemaining <= 14 ? 'high' : daysRemaining <= 30 ? 'medium' : 'low',
      status: daysRemaining < 0 ? 'overdue' : daysRemaining <= 7 ? 'due_soon' : 'upcoming',
      daysRemaining: Math.max(0, daysRemaining),
    } as ComplianceDeadline;
  });
}
