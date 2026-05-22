/**
 * Audit server-actions-002 (2026-05-22): lib-level core for the
 * org-wide compliance snapshot. Does NOT verify caller authz — the
 * server-action wrapper at `@/app/app/actions/compliance-engine`
 * enforces the session→orgId match before delegating here.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { actionError, isNextInternalError } from '@/lib/actions/safe';
import {
  CategoryScore,
  ComplianceSnapshot,
  ControlStatus,
  ControlTaskLinkRow,
  EvidenceRow,
  FrameworkRow,
  FrameworkScore,
  TaskRow,
  isTaskComplete,
  isTaskOverdue,
  riskMultiplier,
  safeSelectControlEvidence,
  safeSelectControlTasks,
  safeSelectControls,
  safeSelectFrameworks,
  safeSelectTasksByIds,
  scoreFromStatus,
} from '@/lib/compliance/_engine-shared';

export async function getOrgComplianceSnapshotCore(
  orgId: string,
  strict: boolean = false,
) {
  try {
    if (!orgId) {
      return {
        overallScore: 0,
        frameworkBreakdown: [],
        categoryBreakdown: [],
        trend: { overallDelta: null, frameworkDeltas: [] },
        openViolations: [],
        highRiskControls: [],
        evidenceBacklog: { pending: 0, rejected: 0, total: 0 },
        taskBacklog: { open: 0, overdue: 0, total: 0 },
        forecast: {
          projectedScoreIn21Days: null,
          daysToFullCompliance: null,
          basis: 'insufficient_data',
        },
      };
    }
    const supabase = await createSupabaseServerClient();

    const frameworks = await safeSelectFrameworks(supabase, orgId, strict);
    const controlsByFramework: Record<string, any[]> = {};
    await Promise.all(
      frameworks.map(async (framework) => {
        controlsByFramework[framework.id] = await safeSelectControls(
          supabase,
          framework.id,
          strict,
        );
      }),
    );

    const allControls = frameworks.flatMap(
      (fw) => controlsByFramework[fw.id] || [],
    );
    const controlIds = allControls.map((c: { id: string }) => c.id);

    const [evidenceRows, controlTaskRows] = await Promise.all([
      safeSelectControlEvidence(supabase, orgId, controlIds, strict),
      safeSelectControlTasks(supabase, orgId, controlIds, strict),
    ]);

    const taskIds = Array.from(
      new Set(controlTaskRows.map((row) => row.task_id).filter(Boolean)),
    );
    const tasks = await safeSelectTasksByIds(supabase, orgId, taskIds, strict);
    const taskById = new Map(tasks.map((t) => [t.id, t]));

    const evidenceByControl = new Map<string, EvidenceRow[]>();
    for (const row of evidenceRows) {
      if (!evidenceByControl.has(row.control_id))
        evidenceByControl.set(row.control_id, []);
      evidenceByControl.get(row.control_id)!.push(row);
    }

    const tasksByControl = new Map<string, TaskRow[]>();
    const entityByControl = new Map<string, string | null>();
    for (const row of controlTaskRows as ControlTaskLinkRow[]) {
      const task = taskById.get(row.task_id);
      if (!task) continue;
      if (!tasksByControl.has(row.control_id))
        tasksByControl.set(row.control_id, []);
      tasksByControl.get(row.control_id)!.push(task);
      if (!entityByControl.get(row.control_id) && row.entity_id) {
        entityByControl.set(row.control_id, row.entity_id);
      }
    }

    const evidenceBacklog = {
      pending: evidenceRows.filter((e) => (e.status || 'pending') === 'pending')
        .length,
      rejected: evidenceRows.filter(
        (e) => (e.status || 'pending') === 'rejected',
      ).length,
      total: 0,
    };
    evidenceBacklog.total = evidenceBacklog.pending + evidenceBacklog.rejected;

    const taskBacklog = {
      open: tasks.filter((t) => !isTaskComplete(t)).length,
      overdue: tasks.filter((t) => isTaskOverdue(t)).length,
      total: 0,
    };
    taskBacklog.total = taskBacklog.open;

    let overallWeight = 0;
    let overallScore = 0;
    const frameworkScores: FrameworkScore[] = [];
    const categoryScores: Record<string, CategoryScore> = {};
    const openViolations: ComplianceSnapshot['openViolations'] = [];
    const highRiskControls: ComplianceSnapshot['highRiskControls'] = [];

    for (const framework of frameworks as FrameworkRow[]) {
      const controls = controlsByFramework[framework.id] || [];
      let fwWeight = 0;
      let fwScore = 0;
      let fwRiskWeight = 0;
      let fwRiskScore = 0;
      let compliant = 0;
      let atRisk = 0;
      let nonCompliant = 0;
      let notApplicable = 0;

      for (const control of controls) {
        const evidenceList = evidenceByControl.get(control.id) ?? [];
        const taskList = tasksByControl.get(control.id) ?? [];
        const entityId =
          evidenceList.find((e) => e.entity_id)?.entity_id ??
          entityByControl.get(control.id) ??
          null;

        const requiredEvidence = Number(control.required_evidence_count ?? 1);
        const isMandatory = control.is_mandatory !== false;
        const weight = Number(control.weight ?? 1);
        const riskLevel = (control.risk_level || 'medium').toLowerCase();
        const riskWeight = riskMultiplier(riskLevel);

        const approvedEvidenceCount = evidenceList.filter(
          (e) => (e.status || 'pending') === 'approved',
        ).length;
        const pendingEvidenceCount = evidenceList.filter(
          (e) => (e.status || 'pending') === 'pending',
        ).length;
        const rejectedEvidenceCount = evidenceList.filter(
          (e) => (e.status || 'pending') === 'rejected',
        ).length;

        const overdueTaskCount = taskList.filter((t) =>
          isTaskOverdue(t),
        ).length;
        const openTaskCount = taskList.filter((t) => !isTaskComplete(t)).length;

        const evidenceSatisfied =
          requiredEvidence <= 0 || approvedEvidenceCount >= requiredEvidence;
        let status: ControlStatus = 'at_risk';

        if (!isMandatory) {
          status = 'not_applicable';
        } else if (evidenceSatisfied && openTaskCount === 0) {
          status = 'compliant';
        } else if (overdueTaskCount > 0) {
          status = 'non_compliant';
        } else if (
          !evidenceSatisfied &&
          (riskLevel === 'critical' || riskLevel === 'high')
        ) {
          status = 'non_compliant';
        } else {
          status = 'at_risk';
        }

        if (status !== 'not_applicable') {
          fwWeight += weight * riskWeight;
          fwScore += weight * riskWeight * scoreFromStatus(status);
          fwRiskWeight += weight * riskWeight;
          fwRiskScore +=
            weight *
            riskWeight *
            (status === 'non_compliant' ? 1 : status === 'at_risk' ? 0.5 : 0);

          overallWeight += weight * riskWeight;
          overallScore += weight * riskWeight * scoreFromStatus(status);
        }

        if (status === 'compliant') compliant++;
        if (status === 'at_risk') atRisk++;
        if (status === 'non_compliant') nonCompliant++;
        if (status === 'not_applicable') notApplicable++;

        if (status !== 'compliant' && isMandatory) {
          openViolations.push({
            controlId: control.id,
            frameworkId: framework.id,
            frameworkCode: framework.code,
            code: control.code,
            title: control.title,
            status,
            riskLevel,
            category: control.category || 'General',
            entityId,
            requiredEvidenceCount: requiredEvidence,
            approvedEvidenceCount,
            pendingEvidenceCount,
            rejectedEvidenceCount,
            openTaskCount,
            overdueTaskCount,
          });
        }

        if (
          (riskLevel === 'high' || riskLevel === 'critical') &&
          status !== 'compliant'
        ) {
          highRiskControls.push({
            controlId: control.id,
            frameworkId: framework.id,
            frameworkCode: framework.code,
            code: control.code,
            title: control.title,
            status,
            riskLevel,
            category: control.category || 'General',
          });
        }

        const categoryKey = control.category || 'General';
        if (!categoryScores[categoryKey]) {
          categoryScores[categoryKey] = {
            category: categoryKey,
            score: 0,
            riskScore: 0,
            totalControls: 0,
            compliant: 0,
            atRisk: 0,
            nonCompliant: 0,
            notApplicable: 0,
          };
        }
        const cat = categoryScores[categoryKey];
        if (status !== 'not_applicable') {
          cat.score += weight * riskWeight * scoreFromStatus(status);
          cat.riskScore +=
            weight *
            riskWeight *
            (status === 'non_compliant' ? 1 : status === 'at_risk' ? 0.5 : 0);
          cat.totalControls += weight * riskWeight;
        }
        if (status === 'compliant') cat.compliant++;
        if (status === 'at_risk') cat.atRisk++;
        if (status === 'non_compliant') cat.nonCompliant++;
        if (status === 'not_applicable') cat.notApplicable++;
      }

      const frameworkScore =
        fwWeight > 0 ? Math.round((fwScore / fwWeight) * 100) : 0;
      const frameworkRiskScore =
        fwRiskWeight > 0 ? Math.round((fwRiskScore / fwRiskWeight) * 100) : 0;

      frameworkScores.push({
        frameworkId: framework.id,
        frameworkCode: framework.code,
        frameworkTitle: framework.title || framework.code,
        score: frameworkScore,
        riskScore: frameworkRiskScore,
        totalControls: controls.length,
        compliant,
        atRisk,
        nonCompliant,
        notApplicable,
      });
    }

    const overallScorePct =
      overallWeight > 0 ? Math.round((overallScore / overallWeight) * 100) : 0;
    const categoryBreakdown = Object.values(categoryScores).map((cat) => ({
      ...cat,
      score:
        cat.totalControls > 0
          ? Math.round((cat.score / cat.totalControls) * 100)
          : 0,
      riskScore:
        cat.totalControls > 0
          ? Math.round((cat.riskScore / cat.totalControls) * 100)
          : 0,
    }));

    let trend = {
      overallDelta: null as number | null,
      frameworkDeltas: [] as Array<{
        frameworkCode: string;
        delta: number | null;
      }>,
    };
    try {
      const { data: snapshotRows } = await supabase
        .from('org_control_evaluations')
        .select('framework_id, compliance_score, last_evaluated_at, details')
        .eq('organization_id', orgId)
        .eq('control_type', 'framework_snapshot')
        .order('last_evaluated_at', { ascending: false })
        .limit(200);

      const rows = snapshotRows ?? [];
      if (rows.length >= 2) {
        trend.overallDelta =
          (rows[0]?.compliance_score ?? 0) - (rows[1]?.compliance_score ?? 0);
      }

      const rowsByFramework: Record<string, any[]> = {};
      for (const row of rows) {
        const frameworkId = row.framework_id as string | undefined;
        if (!frameworkId) continue;
        if (!rowsByFramework[frameworkId]) rowsByFramework[frameworkId] = [];
        rowsByFramework[frameworkId].push(row);
      }

      trend.frameworkDeltas = frameworks.map((fw) => {
        const fwRows = rowsByFramework[fw.id] || [];
        if (fwRows.length < 2) {
          return { frameworkCode: fw.code, delta: null };
        }
        return {
          frameworkCode: fw.code,
          delta:
            (fwRows[0]?.compliance_score ?? 0) -
            (fwRows[1]?.compliance_score ?? 0),
        };
      });
    } catch {
      trend = { overallDelta: null, frameworkDeltas: [] };
    }

    highRiskControls.sort((a, b) => {
      const rank = (level: string) =>
        level === 'critical' ? 3 : level === 'high' ? 2 : 1;
      return rank(b.riskLevel) - rank(a.riskLevel);
    });

    const completedRecently = tasks.filter(
      (t) =>
        t.completed_at &&
        new Date(t.completed_at) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ).length;
    const evidenceApprovedRecently = evidenceRows.filter(
      (e) =>
        (e.status || 'pending') === 'approved' &&
        e.created_at &&
        new Date(e.created_at) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ).length;
    const velocityPerDay = (completedRecently + evidenceApprovedRecently) / 30;
    const backlogItems = taskBacklog.total + evidenceBacklog.total;
    const daysToFull =
      velocityPerDay > 0 ? Math.ceil(backlogItems / velocityPerDay) : null;

    const projectedScoreIn21Days =
      velocityPerDay > 0 && overallWeight > 0
        ? Math.min(
            100,
            Math.round(
              overallScorePct +
                (100 - overallScorePct) * Math.min(1, 21 / (daysToFull || 21)),
            ),
          )
        : null;

    return {
      overallScore: overallScorePct,
      frameworkBreakdown: frameworkScores,
      categoryBreakdown,
      trend,
      openViolations,
      highRiskControls: highRiskControls.slice(0, 5),
      evidenceBacklog,
      taskBacklog,
      forecast: {
        projectedScoreIn21Days,
        daysToFullCompliance: daysToFull,
        basis:
          velocityPerDay > 0 ? '30_day_velocity_model' : 'insufficient_data',
      },
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
