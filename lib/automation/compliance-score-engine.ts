/**
 * Compliance Health Score Engine
 * Calculates real-time compliance scores based on controls, evidence, tasks, and policies
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface ComplianceScoreResult {
  organizationId: string;
  overallScore: number;
  controlsScore: number;
  evidenceScore: number;
  tasksScore: number;
  policiesScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: {
    totalControls: number;
    compliantControls: number;
    atRiskControls: number;
    nonCompliantControls: number;
    totalEvidence: number;
    verifiedEvidence: number;
    pendingEvidence: number;
    rejectedEvidence: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalPolicies: number;
    approvedPolicies: number;
    draftPolicies: number;
  };
  calculatedAt: Date;
}

/**
 * Calculate comprehensive compliance score for an organization
 */
export async function calculateComplianceScore(
  organizationId: string
): Promise<ComplianceScoreResult> {
  const supabase = createSupabaseAdminClient();

  // Fetch all compliance data in parallel
  const [controls, evidence, tasks, policies] = await Promise.all([
    fetchControlsData(supabase, organizationId),
    fetchEvidenceData(supabase, organizationId),
    fetchTasksData(supabase, organizationId),
    fetchPoliciesData(supabase, organizationId),
  ]);

  // Calculate individual scores
  const controlsScore = calculateControlsScore(controls);
  const evidenceScore = calculateEvidenceScore(evidence);
  const tasksScore = calculateTasksScore(tasks);
  const policiesScore = calculatePoliciesScore(policies);

  // Calculate overall weighted score
  const overallScore = calculateOverallScore({
    controlsScore,
    evidenceScore,
    tasksScore,
    policiesScore,
  });

  // Determine risk level
  const riskLevel = determineRiskLevel(overallScore, {
    overdueTasks: tasks.overdueTasks,
    nonCompliantControls: controls.nonCompliantControls,
    rejectedEvidence: evidence.rejectedEvidence,
  });

  return {
    organizationId,
    overallScore,
    controlsScore,
    evidenceScore,
    tasksScore,
    policiesScore,
    riskLevel,
    details: {
      totalControls: controls.totalControls,
      compliantControls: controls.compliantControls,
      atRiskControls: controls.atRiskControls,
      nonCompliantControls: controls.nonCompliantControls,
      totalEvidence: evidence.totalEvidence,
      verifiedEvidence: evidence.verifiedEvidence,
      pendingEvidence: evidence.pendingEvidence,
      rejectedEvidence: evidence.rejectedEvidence,
      totalTasks: tasks.totalTasks,
      completedTasks: tasks.completedTasks,
      overdueTasks: tasks.overdueTasks,
      totalPolicies: policies.totalPolicies,
      approvedPolicies: policies.approvedPolicies,
      draftPolicies: policies.draftPolicies,
    },
    calculatedAt: new Date(),
  };
}

/**
 * Save compliance score to database
 */
export async function saveComplianceScore(
  score: ComplianceScoreResult
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  await supabase.from('org_control_evaluations').upsert({
    organization_id: score.organizationId,
    compliance_score: score.overallScore,
    total_controls: score.details.totalControls,
    satisfied_controls: score.details.compliantControls,
    missing_controls: score.details.nonCompliantControls,
    last_evaluated_at: score.calculatedAt.toISOString(),
    status:
      score.riskLevel === 'low'
        ? 'compliant'
        : score.riskLevel === 'critical'
          ? 'non_compliant'
          : 'at_risk',
    details: {
      controlsScore: score.controlsScore,
      evidenceScore: score.evidenceScore,
      tasksScore: score.tasksScore,
      policiesScore: score.policiesScore,
      riskLevel: score.riskLevel,
      ...score.details,
    },
  });
}

// Helper functions for data fetching
async function fetchControlsData(supabase: any, orgId: string) {
  const { data: controlEvals } = await supabase
    .from('org_control_evaluations')
    .select('status')
    .eq('organization_id', orgId);

  const totalControls = controlEvals?.length || 0;
  const compliantControls =
    controlEvals?.filter((c: any) => c.status === 'compliant').length || 0;
  const atRiskControls =
    controlEvals?.filter((c: any) => c.status === 'at_risk').length || 0;
  const nonCompliantControls =
    controlEvals?.filter((c: any) => c.status === 'non_compliant').length || 0;

  return {
    totalControls,
    compliantControls,
    atRiskControls,
    nonCompliantControls,
  };
}

async function fetchEvidenceData(supabase: any, orgId: string) {
  const { data: evidence } = await supabase
    .from('org_evidence')
    .select('verification_status')
    .eq('organization_id', orgId);

  const totalEvidence = evidence?.length || 0;
  const verifiedEvidence =
    evidence?.filter((e: any) => e.verification_status === 'verified').length ||
    0;
  const pendingEvidence =
    evidence?.filter((e: any) => !e.verification_status).length || 0;
  const rejectedEvidence =
    evidence?.filter((e: any) => e.verification_status === 'rejected').length ||
    0;

  return {
    totalEvidence,
    verifiedEvidence,
    pendingEvidence,
    rejectedEvidence,
  };
}

async function fetchTasksData(supabase: any, orgId: string) {
  const { data: tasks } = await supabase
    .from('org_tasks')
    .select('status, due_date')
    .eq('organization_id', orgId);

  const totalTasks = tasks?.length || 0;
  const completedTasks =
    tasks?.filter((t: any) => t.status === 'completed').length || 0;

  const now = new Date();
  const overdueTasks =
    tasks?.filter(
      (t: any) =>
        t.status !== 'completed' &&
        t.due_date &&
        new Date(t.due_date) < now
    ).length || 0;

  return { totalTasks, completedTasks, overdueTasks };
}

async function fetchPoliciesData(supabase: any, orgId: string) {
  const { data: policies } = await supabase
    .from('org_policies')
    .select('status')
    .eq('organization_id', orgId);

  const totalPolicies = policies?.length || 0;
  const approvedPolicies =
    policies?.filter(
      (p: any) => p.status === 'approved' || p.status === 'published'
    ).length || 0;
  const draftPolicies =
    policies?.filter((p: any) => p.status === 'draft').length || 0;

  return { totalPolicies, approvedPolicies, draftPolicies };
}

// Scoring calculations
function calculateControlsScore(data: any): number {
  if (data.totalControls === 0) return 100;

  const compliantWeight = 1.0;
  const atRiskWeight = 0.5;
  const nonCompliantWeight = 0.0;

  const weightedScore =
    (data.compliantControls * compliantWeight +
      data.atRiskControls * atRiskWeight +
      data.nonCompliantControls * nonCompliantWeight) /
    data.totalControls;

  return Math.round(weightedScore * 100);
}

function calculateEvidenceScore(data: any): number {
  if (data.totalEvidence === 0) return 50; // Neutral score if no evidence

  const verifiedWeight = 1.0;
  const pendingWeight = 0.3;
  const rejectedWeight = 0.0;

  const weightedScore =
    (data.verifiedEvidence * verifiedWeight +
      data.pendingEvidence * pendingWeight +
      data.rejectedEvidence * rejectedWeight) /
    data.totalEvidence;

  return Math.round(weightedScore * 100);
}

function calculateTasksScore(data: any): number {
  if (data.totalTasks === 0) return 100;

  const completionRate = data.completedTasks / data.totalTasks;
  const overdueRate = data.overdueTasks / data.totalTasks;

  // Penalty for overdue tasks
  const score = completionRate * 100 - overdueRate * 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculatePoliciesScore(data: any): number {
  if (data.totalPolicies === 0) return 50;

  const approvalRate = data.approvedPolicies / data.totalPolicies;

  return Math.round(approvalRate * 100);
}

function calculateOverallScore(scores: {
  controlsScore: number;
  evidenceScore: number;
  tasksScore: number;
  policiesScore: number;
}): number {
  // Weighted average - controls and evidence are most important
  const weights = {
    controls: 0.4,
    evidence: 0.3,
    tasks: 0.2,
    policies: 0.1,
  };

  const overallScore =
    scores.controlsScore * weights.controls +
    scores.evidenceScore * weights.evidence +
    scores.tasksScore * weights.tasks +
    scores.policiesScore * weights.policies;

  return Math.round(overallScore);
}

function determineRiskLevel(
  score: number,
  data: { overdueTasks: number; nonCompliantControls: number; rejectedEvidence: number }
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical if multiple red flags
  if (
    score < 40 ||
    data.nonCompliantControls > 5 ||
    (data.overdueTasks > 10 && data.rejectedEvidence > 3)
  ) {
    return 'critical';
  }

  // High if low score or significant issues
  if (score < 60 || data.nonCompliantControls > 2 || data.overdueTasks > 5) {
    return 'high';
  }

  // Medium if moderate score
  if (score < 80 || data.overdueTasks > 2) {
    return 'medium';
  }

  // Low risk
  return 'low';
}

/**
 * Calculate and save compliance score for an organization
 */
export async function updateComplianceScore(
  organizationId: string
): Promise<ComplianceScoreResult> {
  const score = await calculateComplianceScore(organizationId);
  await saveComplianceScore(score);
  return score;
}
