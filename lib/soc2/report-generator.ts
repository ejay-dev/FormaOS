import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { calculateSoc2Readiness, getAssessmentHistory } from './readiness-engine';
import { runAutomatedChecks } from './evidence-collector';
import { analyzeSoc2Gaps } from './gap-analyzer';
import { ensureMilestones, evaluateMilestones, getMilestones } from './milestone-tracker';
import type {
  Soc2CertificationReport,
  Soc2RemediationAction,
} from './types';

// ---------------------------------------------------------------------------
// Generate full SOC 2 certification report
// ---------------------------------------------------------------------------

export async function generateSoc2Report(
  orgId: string,
): Promise<Soc2CertificationReport> {
  const supabase = createSupabaseAdminClient();

  // 1. Get organization name
  const { data: orgRow } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .maybeSingle();

  const organizationName = (orgRow as Record<string, unknown> | null)?.name as string ?? 'Unknown Organization';

  // 2. Run a fresh readiness assessment
  const readinessResult = await calculateSoc2Readiness(orgId);

  // 3. Run automated checks
  const automatedChecks = await runAutomatedChecks(orgId);

  // 4. Ensure milestones and evaluate them
  await ensureMilestones(orgId);
  await evaluateMilestones(orgId, readinessResult);
  const milestones = await getMilestones(orgId);

  // 5. Analyze gaps and get remediation actions
  await analyzeSoc2Gaps(orgId, readinessResult.controlResults);

  // Load all remediation actions (including previously created ones)
  const { data: allActions } = await supabase
    .from('soc2_remediation_actions')
    .select('*')
    .eq('organization_id', orgId)
    .order('priority', { ascending: true });

  const remediationActions: Soc2RemediationAction[] = (
    (allActions ?? []) as Record<string, unknown>[]
  ).map((row) => ({
    id: row.id as string,
    controlCode: row.control_code as string,
    actionType: row.action_type as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as Soc2RemediationAction['status'],
    linkedTaskId: (row.linked_task_id as string | null) ?? null,
    linkedEvidenceId: (row.linked_evidence_id as string | null) ?? null,
    priority: row.priority as Soc2RemediationAction['priority'],
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  }));

  // 6. Score history
  const scoreHistory = await getAssessmentHistory(orgId, 10);

  // 7. Mark report_generated milestone as complete
  await supabase
    .from('soc2_milestones')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('milestone_key', 'report_generated');

  return {
    organizationName,
    assessmentDate: readinessResult.assessedAt,
    overallScore: readinessResult.overallScore,
    domainScores: readinessResult.domainScores,
    controlResults: readinessResult.controlResults,
    automatedChecks,
    milestones,
    remediationActions,
    scoreHistory,
  };
}
