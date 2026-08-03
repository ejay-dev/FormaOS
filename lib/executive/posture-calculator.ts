/**
 * Executive Posture Calculator
 * Aggregates organization-wide compliance posture for C-level visibility
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { calculateFrameworkReadiness } from '@/lib/audit/readiness-calculator';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';
import { consoleShim } from '@/lib/monitoring/console-shim';
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

  // Trend source is compliance_score_snapshots (per-framework, 0–100), not the
  // never-created `org_compliance_snapshots`. Average the most-recent prior
  // per-framework snapshots to approximate the org's overall score 30 days ago.
  const { data: previousSnapshots } = await admin
    .from('compliance_score_snapshots')
    .select('compliance_score, captured_at')
    .eq('organization_id', orgId)
    .lte('captured_at', thirtyDaysAgo.toISOString())
    .order('captured_at', { ascending: false })
    .limit(10);

  const previousScore =
    previousSnapshots && previousSnapshots.length > 0
      ? Math.round(
          previousSnapshots.reduce(
            (s: number, r: { compliance_score: number | string }) =>
              s + Number(r.compliance_score),
            0,
          ) / previousSnapshots.length,
        )
      : weightedScore;
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
  // Bug fix: the multiply-by-10 was outside Math.round, so effectiveness could
  // only ever be a multiple of 10. Round the final value instead.
  const automationEffectiveness =
    activeWorkflows > 0
      ? Math.min(100, Math.round(((workflowTriggers || 0) / activeWorkflows) * 10))
      : 0;

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
 * Per-control rows in org_control_evaluations are control_type='framework_control'
 * (there has never been a 'control_snapshot' row). The table has no control_id,
 * gap_description, evidence_count or required_evidence column: the control's
 * identity and evidence counts live in `details`, and the verdict in `status`.
 * lib/frameworks/provisioning.ts writes control_code/control_title,
 * lib/compliance/evaluate-framework-controls.ts writes code/title + evaluator.
 */
type ControlEvaluationRow = {
  id: string;
  framework_id: string | null;
  control_key: string | null;
  status: string | null;
  compliance_score: number | null;
  last_evaluated_at: string | null;
  details: Record<string, unknown> | null;
};

const FAILING_CONTROL_STATUSES = [
  'at_risk',
  'partial',
  'in_progress',
  'non_compliant',
  'failed',
];

/** compliance_score is only written by the seed generator; status is authoritative. */
const CONTROL_STATUS_SCORES: Record<string, number> = {
  compliant: 100,
  satisfied: 100,
  met: 100,
  partial: 50,
  in_progress: 50,
  at_risk: 50,
  non_compliant: 0,
  failed: 0,
};

function controlScoreFromRow(row: ControlEvaluationRow): number {
  const rawScore = Number(row.compliance_score ?? 0);
  if (rawScore > 0) return rawScore;
  return CONTROL_STATUS_SCORES[(row.status ?? '').toLowerCase()] ?? 0;
}

function controlCodeFromRow(row: ControlEvaluationRow): string {
  const details = row.details ?? {};
  const fromDetails = details.control_code ?? details.code;
  if (typeof fromDetails === 'string' && fromDetails) return fromDetails;
  // Seed rows put the bare code in control_key; evaluated rows use
  // `control:<compliance_controls.id>`, which is not a display value.
  if (row.control_key && !row.control_key.startsWith('control:')) {
    return row.control_key;
  }
  return 'UNKNOWN';
}

function controlTitleFromRow(row: ControlEvaluationRow): string {
  const details = row.details ?? {};
  const fromDetails = details.control_title ?? details.title;
  return typeof fromDetails === 'string' && fromDetails
    ? fromDetails
    : 'Unknown Control';
}

/**
 * Get critical control failures (controls with score < 50%)
 */
async function getCriticalControlFailures(
  orgId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>
): Promise<CriticalControl[]> {
  const { data, error } = await admin
    .from('org_control_evaluations')
    .select(
      'id, framework_id, control_key, status, compliance_score, last_evaluated_at, details'
    )
    .eq('organization_id', orgId)
    .eq('control_type', 'framework_control')
    .in('status', FAILING_CONTROL_STATUSES)
    .order('compliance_score', { ascending: true })
    .order('last_evaluated_at', { ascending: false })
    .limit(10);

  if (error) {
    consoleShim.error(
      '[ExecutivePosture] Failed to fetch control evaluations:',
      error
    );
    return [];
  }

  const evaluations = (data ?? []) as ControlEvaluationRow[];
  if (!evaluations.length) return [];

  // Get framework codes
  const frameworkIds = [
    ...new Set(evaluations.map((row) => row.framework_id).filter(Boolean)),
  ] as string[];
  const { data: frameworks } = await admin
    .from('compliance_frameworks')
    // Schema column is `name` (audit database-017). Alias for API stability.
    .select('id, code, title:name')
    .in('id', frameworkIds);

  const frameworkMap = new Map<string, { id: string; code: string; title: string }>(
    frameworks?.map((f: { id: string; code: string; title: string }) => [f.id, f]) || []
  );

  return evaluations.map((row) => {
    const details = row.details ?? {};
    const framework = row.framework_id
      ? frameworkMap.get(row.framework_id)
      : undefined;
    const detailsFrameworkCode =
      typeof details.framework_code === 'string' ? details.framework_code : undefined;
    const evaluator = details.evaluator as { reason?: string | null } | null | undefined;
    const score = controlScoreFromRow(row);

    return {
      id: row.id,
      controlCode: controlCodeFromRow(row),
      title: controlTitleFromRow(row),
      framework: framework?.title || detailsFrameworkCode || 'Unknown Framework',
      frameworkCode: framework?.code || detailsFrameworkCode || 'UNKNOWN',
      status: score < 25 ? 'critical' : score < 40 ? 'high' : 'medium',
      dueDate: undefined,
      lastEvaluated: row.last_evaluated_at ?? '',
      gapDescription:
        typeof evaluator?.reason === 'string' ? evaluator.reason : undefined,
      evidenceCount: Number(details.approved_evidence_count ?? 0),
      requiredEvidence: Number(details.required_evidence_count ?? 1),
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

  const { data: deadlines, error } = await admin
    .from('org_compliance_deadlines')
    .select('*')
    .eq('organization_id', orgId)
    .gte('due_date', now.toISOString().split('T')[0])
    .lte('due_date', ninetyDaysFromNow.toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(10);

  if (error) {
    if (isMissingSupabaseTableError(error, 'org_compliance_deadlines')) {
      return [];
    }

    consoleShim.error('[ExecutivePosture] Failed to fetch upcoming deadlines:', error);
    return [];
  }

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
