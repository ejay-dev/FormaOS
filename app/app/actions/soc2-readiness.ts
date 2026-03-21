'use server';

import { requirePermission } from '@/app/app/actions/rbac';
import { calculateSoc2Readiness, getLatestAssessment } from '@/lib/soc2/readiness-engine';
import { runAutomatedChecks } from '@/lib/soc2/evidence-collector';
import { analyzeSoc2Gaps } from '@/lib/soc2/gap-analyzer';
import {
  ensureMilestones,
  evaluateMilestones,
  getMilestones,
} from '@/lib/soc2/milestone-tracker';
import { generateSoc2Report } from '@/lib/soc2/report-generator';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  Soc2ReadinessResult,
  Soc2Milestone,
  Soc2RemediationAction,
  AutomatedCheckResult,
  Soc2CertificationReport,
} from '@/lib/soc2/types';

// ---------------------------------------------------------------------------
// Run a full SOC 2 readiness assessment
// ---------------------------------------------------------------------------

export async function runSoc2Assessment(): Promise<Soc2ReadinessResult> {
  const permissionCtx = await requirePermission('EDIT_CONTROLS');
  const result = await calculateSoc2Readiness(permissionCtx.orgId);

  // Also ensure milestones exist and evaluate them
  await ensureMilestones(permissionCtx.orgId);
  await evaluateMilestones(permissionCtx.orgId, result);

  // Run gap analysis for any missing/partial controls
  await analyzeSoc2Gaps(permissionCtx.orgId, result.controlResults);

  return result;
}

// ---------------------------------------------------------------------------
// Get dashboard data (assessment + milestones + remediation + checks)
// ---------------------------------------------------------------------------

interface Soc2DashboardData {
  assessment: Soc2ReadinessResult | null;
  milestones: Soc2Milestone[];
  remediationActions: Soc2RemediationAction[];
  automatedChecks: AutomatedCheckResult[];
}

export async function getSoc2DashboardData(): Promise<Soc2DashboardData> {
  const permissionCtx = await requirePermission('VIEW_CONTROLS');
  const orgId = permissionCtx.orgId;

  // Ensure milestones exist
  await ensureMilestones(orgId);

  // Load data in parallel
  const [assessment, milestones, automatedChecks, remediationData] =
    await Promise.all([
      getLatestAssessment(orgId),
      getMilestones(orgId),
      runAutomatedChecks(orgId),
      loadRemediationActions(orgId),
    ]);

  return {
    assessment,
    milestones,
    remediationActions: remediationData,
    automatedChecks,
  };
}

async function loadRemediationActions(
  orgId: string,
): Promise<Soc2RemediationAction[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('soc2_remediation_actions')
    .select('*')
    .eq('organization_id', orgId)
    .order('priority', { ascending: true });

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
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
}

// ---------------------------------------------------------------------------
// Update milestone status / target date
// ---------------------------------------------------------------------------

export async function updateMilestoneAction(
  milestoneId: string,
  updates: { status?: Soc2Milestone['status']; targetDate?: string | null },
): Promise<{ success: boolean }> {
  const permissionCtx = await requirePermission('EDIT_CONTROLS');
  const supabase = await createSupabaseServerClient();

  const updatePayload: Record<string, unknown> = {};
  if (updates.status !== undefined) {
    updatePayload.status = updates.status;
    if (updates.status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }
  }
  if (updates.targetDate !== undefined) {
    updatePayload.target_date = updates.targetDate;
  }

  const { error } = await supabase
    .from('soc2_milestones')
    .update(updatePayload)
    .eq('id', milestoneId)
    .eq('organization_id', permissionCtx.orgId);

  if (error) throw new Error(`Failed to update milestone: ${error.message}`);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Mark a remediation action as completed
// ---------------------------------------------------------------------------

export async function completeRemediationAction(
  actionId: string,
): Promise<{ success: boolean }> {
  const permissionCtx = await requirePermission('EDIT_CONTROLS');
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('soc2_remediation_actions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', actionId)
    .eq('organization_id', permissionCtx.orgId);

  if (error) throw new Error(`Failed to complete remediation action: ${error.message}`);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Generate SOC 2 certification report
// ---------------------------------------------------------------------------

export async function generateReportAction(): Promise<Soc2CertificationReport> {
  const permissionCtx = await requirePermission('GENERATE_CERTIFICATIONS');
  return generateSoc2Report(permissionCtx.orgId);
}
