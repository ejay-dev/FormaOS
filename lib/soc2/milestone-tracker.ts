import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Soc2Milestone, Soc2ReadinessResult } from './types';

// ---------------------------------------------------------------------------
// Default milestones
// ---------------------------------------------------------------------------

const DEFAULT_MILESTONES = [
  { key: 'frameworks_enabled', title: 'SOC 2 framework enabled', sort: 1 },
  { key: 'policies_drafted', title: 'Core security policies drafted', sort: 2 },
  { key: 'access_controls', title: 'Access controls implemented', sort: 3 },
  { key: 'monitoring_configured', title: 'Security monitoring configured', sort: 4 },
  { key: 'evidence_collected', title: 'Evidence collection complete', sort: 5 },
  { key: 'gaps_remediated', title: 'All critical gaps remediated', sort: 6 },
  { key: 'readiness_80', title: 'Readiness score exceeds 80%', sort: 7 },
  { key: 'report_generated', title: 'Certification report generated', sort: 8 },
] as const;

// ---------------------------------------------------------------------------
// Ensure milestones exist (upsert defaults)
// ---------------------------------------------------------------------------

export async function ensureMilestones(orgId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const rows = DEFAULT_MILESTONES.map((m) => ({
    organization_id: orgId,
    milestone_key: m.key,
    title: m.title,
    sort_order: m.sort,
    status: 'pending',
  }));

  // Upsert: insert if missing, skip if exists (preserve current state)
  await supabase
    .from('soc2_milestones')
    .upsert(rows, { onConflict: 'organization_id,milestone_key', ignoreDuplicates: true });
}

// ---------------------------------------------------------------------------
// Evaluate milestones based on current system state
// ---------------------------------------------------------------------------

export async function evaluateMilestones(
  orgId: string,
  readinessResult: Soc2ReadinessResult,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  // Load current milestones
  const { data: milestones } = await supabase
    .from('soc2_milestones')
    .select('*')
    .eq('organization_id', orgId);

  const milestoneMap = new Map<string, Record<string, unknown>>();
  for (const m of (milestones ?? []) as Record<string, unknown>[]) {
    milestoneMap.set(m.milestone_key as string, m);
  }

  // Helper to auto-complete a milestone
  const autoComplete = async (key: string) => {
    const milestone = milestoneMap.get(key);
    if (!milestone || milestone.status === 'completed') return;

    await supabase
      .from('soc2_milestones')
      .update({ status: 'completed', completed_at: now })
      .eq('organization_id', orgId)
      .eq('milestone_key', key);
  };

  // Helper to set in_progress
  const setInProgress = async (key: string) => {
    const milestone = milestoneMap.get(key);
    if (!milestone || milestone.status === 'completed' || milestone.status === 'in_progress') return;

    await supabase
      .from('soc2_milestones')
      .update({ status: 'in_progress' })
      .eq('organization_id', orgId)
      .eq('milestone_key', key);
  };

  // --- Check: SOC 2 framework enabled ---
  // If we got this far with a readiness result, the framework is enabled
  await autoComplete('frameworks_enabled');

  // --- Check: Core security policies drafted ---
  const { data: securityPolicies } = await supabase
    .from('org_policies')
    .select('id')
    .eq('organization_id', orgId)
    .ilike('title', '%security%')
    .limit(1);

  if ((securityPolicies ?? []).length > 0) {
    await autoComplete('policies_drafted');
  } else {
    await setInProgress('policies_drafted');
  }

  // --- Check: Access controls implemented ---
  const s2Control = readinessResult.controlResults.find((c) => c.controlCode === 'SOC2-S2');
  if (s2Control && s2Control.status === 'satisfied') {
    await autoComplete('access_controls');
  } else if (s2Control && s2Control.status === 'partial') {
    await setInProgress('access_controls');
  }

  // --- Check: Security monitoring configured ---
  const s3Control = readinessResult.controlResults.find((c) => c.controlCode === 'SOC2-S3');
  if (s3Control && s3Control.status === 'satisfied') {
    await autoComplete('monitoring_configured');
  } else if (s3Control && s3Control.status === 'partial') {
    await setInProgress('monitoring_configured');
  }

  // --- Check: Evidence collection complete ---
  const allControlsHaveEvidence = readinessResult.controlResults.every(
    (c) => c.evidenceCount > 0,
  );
  if (allControlsHaveEvidence) {
    await autoComplete('evidence_collected');
  } else {
    const someHaveEvidence = readinessResult.controlResults.some(
      (c) => c.evidenceCount > 0,
    );
    if (someHaveEvidence) {
      await setInProgress('evidence_collected');
    }
  }

  // --- Check: All critical gaps remediated ---
  const { data: criticalActions } = await supabase
    .from('soc2_remediation_actions')
    .select('id, status')
    .eq('organization_id', orgId)
    .eq('priority', 'critical');

  const allCriticalDone = ((criticalActions ?? []) as Record<string, unknown>[]).every(
    (a) => a.status === 'completed' || a.status === 'skipped',
  );

  if ((criticalActions ?? []).length > 0 && allCriticalDone) {
    await autoComplete('gaps_remediated');
  } else if ((criticalActions ?? []).length > 0) {
    const someDone = ((criticalActions ?? []) as Record<string, unknown>[]).some(
      (a) => a.status === 'completed',
    );
    if (someDone) {
      await setInProgress('gaps_remediated');
    }
  }

  // --- Check: Readiness score exceeds 80% ---
  if (readinessResult.overallScore >= 80) {
    await autoComplete('readiness_80');
  } else if (readinessResult.overallScore >= 40) {
    await setInProgress('readiness_80');
  }

  // Note: 'report_generated' milestone is completed when a report is actually generated
}

// ---------------------------------------------------------------------------
// Get milestones
// ---------------------------------------------------------------------------

export async function getMilestones(orgId: string): Promise<Soc2Milestone[]> {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from('soc2_milestones')
    .select('*')
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: true });

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    milestoneKey: row.milestone_key as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    targetDate: (row.target_date as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    status: row.status as Soc2Milestone['status'],
    sortOrder: row.sort_order as number,
  }));
}
