import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import soc2Pack from '@/framework-packs/soc2.json';
import type { Soc2ReadinessResult, Soc2ControlResult, Soc2DomainScore } from './types';

// ---------------------------------------------------------------------------
// Types for the SOC 2 framework pack JSON
// ---------------------------------------------------------------------------

interface Soc2PackControl {
  control_code: string;
  title: string;
  summary_description: string;
  implementation_guidance: string;
  default_risk_level: string;
  domain: string;
  suggested_evidence_types: string[];
  suggested_task_templates: { title: string; description: string; priority: string }[];
}

interface Soc2PackDomain {
  name: string;
  key: string;
}

// DB row shapes
interface EvaluationRow {
  control_key: string;
  compliance_score: number | null;
  status: string | null;
}

// ---------------------------------------------------------------------------
// Domain weight configuration
// ---------------------------------------------------------------------------

const DOMAIN_WEIGHTS: Record<string, number> = {
  Security: 30,
  Availability: 20,
  Confidentiality: 20,
  'Processing Integrity': 15,
  Privacy: 15,
};

// ---------------------------------------------------------------------------
// Main readiness calculation
// ---------------------------------------------------------------------------

export async function calculateSoc2Readiness(
  orgId: string,
): Promise<Soc2ReadinessResult> {
  const supabase = createSupabaseAdminClient();
  const controls = soc2Pack.controls as Soc2PackControl[];
  const domains = soc2Pack.domains as Soc2PackDomain[];

  // 1. Load evaluations for SOC2 controls
  const controlKeys = controls.map((c) => c.control_code);
  const { data: evaluations } = await supabase
    .from('org_control_evaluations')
    .select('control_key, compliance_score, status')
    .eq('organization_id', orgId)
    .eq('control_type', 'framework')
    .in('control_key', controlKeys);

  const evalMap = new Map<string, EvaluationRow>();
  for (const row of (evaluations ?? []) as Record<string, unknown>[]) {
    evalMap.set(
      row.control_key as string,
      {
        control_key: row.control_key as string,
        compliance_score: row.compliance_score as number | null,
        status: row.status as string | null,
      },
    );
  }

  // 2. Load evidence counts per control via compliance_controls join
  const { data: controlRows } = await supabase
    .from('compliance_controls')
    .select('id, code')
    .in('code', controlKeys);

  const controlIdMap = new Map<string, string>(); // code -> id
  for (const row of (controlRows ?? []) as Record<string, unknown>[]) {
    controlIdMap.set(row.code as string, row.id as string);
  }
  const controlIds = Array.from(controlIdMap.values());

  // Evidence counts
  const evidenceCounts = new Map<string, number>();
  if (controlIds.length > 0) {
    const { data: evidenceRows } = await supabase
      .from('control_evidence')
      .select('control_id')
      .eq('organization_id', orgId)
      .in('control_id', controlIds);

    const countByControlId = new Map<string, number>();
    for (const row of (evidenceRows ?? []) as Record<string, unknown>[]) {
      const cid = row.control_id as string;
      countByControlId.set(cid, (countByControlId.get(cid) ?? 0) + 1);
    }

    // Map back to control codes
    for (const [code, id] of controlIdMap.entries()) {
      const count = countByControlId.get(id) ?? 0;
      evidenceCounts.set(code, count);
    }
  }

  // 3. Load task counts via control_tasks + org_tasks
  const taskCountMap = new Map<string, { total: number; completed: number }>();
  if (controlIds.length > 0) {
    const { data: taskLinks } = await supabase
      .from('control_tasks')
      .select('control_id, task_id')
      .eq('organization_id', orgId)
      .in('control_id', controlIds);

    const taskIds = Array.from(
      new Set(
        ((taskLinks ?? []) as Record<string, unknown>[]).map(
          (r) => r.task_id as string,
        ),
      ),
    );

    const taskStatusMap = new Map<string, string>();
    if (taskIds.length > 0) {
      const { data: tasks } = await supabase
        .from('org_tasks')
        .select('id, status')
        .eq('organization_id', orgId)
        .in('id', taskIds);

      for (const t of (tasks ?? []) as Record<string, unknown>[]) {
        taskStatusMap.set(t.id as string, (t.status as string) ?? 'pending');
      }
    }

    // Aggregate per control_id -> code
    const tasksByControlId = new Map<string, { total: number; completed: number }>();
    for (const link of (taskLinks ?? []) as Record<string, unknown>[]) {
      const cid = link.control_id as string;
      const tid = link.task_id as string;
      const entry = tasksByControlId.get(cid) ?? { total: 0, completed: 0 };
      entry.total++;
      const status = taskStatusMap.get(tid);
      if (status === 'completed' || status === 'done') {
        entry.completed++;
      }
      tasksByControlId.set(cid, entry);
    }

    for (const [code, id] of controlIdMap.entries()) {
      const entry = tasksByControlId.get(id);
      if (entry) {
        taskCountMap.set(code, entry);
      }
    }
  }

  // 4. Map each control to a result
  const controlResults: Soc2ControlResult[] = controls.map((control) => {
    const evaluation = evalMap.get(control.control_code);
    const score = evaluation?.compliance_score ?? 0;
    const evCount = evidenceCounts.get(control.control_code) ?? 0;
    const tasks = taskCountMap.get(control.control_code) ?? { total: 0, completed: 0 };

    let status: Soc2ControlResult['status'];
    if (score >= 80) {
      status = 'satisfied';
    } else if (score >= 40) {
      status = 'partial';
    } else {
      status = 'missing';
    }

    const gaps: string[] = [];
    if (evCount === 0) {
      gaps.push('No evidence collected');
    }
    if (tasks.total === 0) {
      gaps.push('No tasks assigned');
    } else if (tasks.completed < tasks.total) {
      gaps.push(`${tasks.total - tasks.completed} of ${tasks.total} tasks incomplete`);
    }
    if (score < 80 && evCount > 0) {
      gaps.push('Evidence exists but compliance score below threshold');
    }

    return {
      controlCode: control.control_code,
      title: control.title,
      domain: control.domain,
      riskLevel: control.default_risk_level,
      status,
      score,
      evidenceCount: evCount,
      taskCount: tasks.total,
      completedTaskCount: tasks.completed,
      suggestedEvidenceTypes: control.suggested_evidence_types,
      implementationGuidance: control.implementation_guidance,
      gaps,
    };
  });

  // 5. Calculate domain scores
  const domainScores: Soc2DomainScore[] = domains.map((domain) => {
    const domainControls = controlResults.filter((c) => c.domain === domain.name);
    const totalControls = domainControls.length;
    const avgScore =
      totalControls > 0
        ? domainControls.reduce((sum, c) => sum + c.score, 0) / totalControls
        : 0;

    return {
      domain: domain.name,
      key: domain.key,
      score: Math.round(avgScore * 100) / 100,
      totalControls,
      satisfiedControls: domainControls.filter((c) => c.status === 'satisfied').length,
      partialControls: domainControls.filter((c) => c.status === 'partial').length,
      missingControls: domainControls.filter((c) => c.status === 'missing').length,
    };
  });

  // 6. Calculate overall score as weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  for (const ds of domainScores) {
    const weight = DOMAIN_WEIGHTS[ds.domain] ?? 10;
    weightedSum += ds.score * weight;
    totalWeight += weight;
  }
  const overallScore =
    totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;

  const assessedAt = new Date().toISOString();

  // 7. Save the assessment
  await supabase.from('soc2_readiness_assessments').insert({
    organization_id: orgId,
    overall_score: overallScore,
    domain_scores: domainScores,
    control_results: controlResults,
    evidence_summary: {
      totalEvidence: Array.from(evidenceCounts.values()).reduce((a, b) => a + b, 0),
      controlsWithEvidence: Array.from(evidenceCounts.values()).filter((v) => v > 0).length,
    },
    assessed_at: assessedAt,
  });

  return {
    overallScore,
    domainScores,
    controlResults,
    totalControls: controlResults.length,
    satisfiedControls: controlResults.filter((c) => c.status === 'satisfied').length,
    assessedAt,
  };
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export async function getLatestAssessment(
  orgId: string,
): Promise<Soc2ReadinessResult | null> {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from('soc2_readiness_assessments')
    .select('*')
    .eq('organization_id', orgId)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as Record<string, unknown>;
  const controlResults = (row.control_results ?? []) as Soc2ControlResult[];

  return {
    overallScore: row.overall_score as number,
    domainScores: (row.domain_scores ?? []) as Soc2DomainScore[],
    controlResults,
    totalControls: controlResults.length,
    satisfiedControls: controlResults.filter((c) => c.status === 'satisfied').length,
    assessedAt: row.assessed_at as string,
  };
}

export async function getAssessmentHistory(
  orgId: string,
  limit: number = 10,
): Promise<{ date: string; score: number }[]> {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from('soc2_readiness_assessments')
    .select('assessed_at, overall_score')
    .eq('organization_id', orgId)
    .order('assessed_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    date: row.assessed_at as string,
    score: row.overall_score as number,
  }));
}
