/**
 * Audit server-actions-002 (2026-05-22): lib-level core for framework
 * control evaluation. Does NOT verify caller authz — the server-action
 * wrapper at `@/app/app/actions/compliance-engine` enforces the
 * session→orgId match before delegating here. Calling this directly is
 * only safe from server-only code paths that already have a trusted
 * orgId.
 */

import * as Sentry from '@sentry/nextjs';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireEntitlement } from '@/lib/billing/entitlements';
import { logActivity as logProductActivity } from '@/lib/activity/feed';
import { notify } from '@/lib/notifications/engine';
import { logAuditEventCore } from '@/lib/audit/log-audit-event';
import { createCorrelationId } from '@/lib/security/correlation';
import { actionError, isNextInternalError } from '@/lib/actions/safe';
import {
  ControlRow,
  ControlStatus,
  ControlTaskLinkRow,
  DbClient,
  EvaluationRow,
  EvidenceRow,
  TaskRow,
  isTaskComplete,
  isTaskOverdue,
  logEvaluationAudit,
  riskMultiplier,
  safeLogActivity,
  safeSelectControlEvidence,
  safeSelectControlTasks,
  safeSelectControls,
  safeSelectTasksByIds,
  scoreFromStatus,
  stableHash,
  upsertEvaluations,
} from '@/lib/compliance/_engine-shared';
import { getFrameworkSlugForCode } from '@/lib/frameworks/framework-installer';
import { registerAllEvaluators } from '@/lib/compliance/evaluators/register';
import { getEvaluator } from '@/lib/compliance/evaluators';
import { runControlEvaluation } from '@/lib/compliance/evaluators/run-control';
import { consoleShim } from '@/lib/monitoring/console-shim';
import {
  autoCreateCapaFromFailures,
  type FailingControl,
} from '@/lib/compliance/capa/auto-create';
import type {
  ControlResult,
  FrameworkSlug,
} from '@/lib/compliance/evaluators/types';

/**
 * Map an evaluator status (`pass | partial | fail | not_evaluated`)
 * onto the engine's `ControlStatus`. `not_evaluated` returns null so
 * callers know to retain the heuristic value — registry evaluators
 * MUST NOT downgrade a control silently when they have nothing to
 * say.
 */
function evaluatorStatusToEngineStatus(
  result: ControlResult,
): ControlStatus | null {
  switch (result.status) {
    case 'pass':
      return 'compliant';
    case 'partial':
      return 'at_risk';
    case 'fail':
      return 'non_compliant';
    case 'not_evaluated':
    default:
      return null;
  }
}

async function refreshComplianceBlocks(
  supabase: DbClient,
  orgId: string,
  frameworkCode: string,
  missingMandatoryCodes: string[],
) {
  const frameworkGate =
    frameworkCode === 'ISO27001'
      ? 'FRAMEWORK_ISO27001'
      : frameworkCode === 'SOC2'
        ? 'FRAMEWORK_SOC2'
        : frameworkCode === 'HIPAA'
          ? 'FRAMEWORK_HIPAA'
          : frameworkCode === 'NDIS'
            ? 'FRAMEWORK_NDIS'
            : null;

  const reason = `${missingMandatoryCodes.length} mandatory controls missing required evidence or remediation.`;

  if (missingMandatoryCodes.length > 0) {
    const { data: existingAudit } = await supabase
      .from('org_compliance_blocks')
      .select('id')
      .eq('organization_id', orgId)
      .eq('gate_key', 'AUDIT_EXPORT')
      .is('resolved_at', null)
      .limit(1);

    if (!existingAudit || existingAudit.length === 0) {
      await supabase.from('org_compliance_blocks').insert({
        organization_id: orgId,
        gate_key: 'AUDIT_EXPORT',
        reason,
        created_by: null,
        metadata: {
          framework: frameworkCode,
          missingCodes: missingMandatoryCodes.slice(0, 50),
        },
      });
    }

    const { data: existingCert } = await supabase
      .from('org_compliance_blocks')
      .select('id')
      .eq('organization_id', orgId)
      .eq('gate_key', 'CERT_REPORT')
      .is('resolved_at', null)
      .limit(1);

    if (!existingCert || existingCert.length === 0) {
      await supabase.from('org_compliance_blocks').insert({
        organization_id: orgId,
        gate_key: 'CERT_REPORT',
        reason,
        created_by: null,
        metadata: {
          framework: frameworkCode,
          missingCodes: missingMandatoryCodes.slice(0, 50),
        },
      });
    }

    if (frameworkGate) {
      const { data: existingFw } = await supabase
        .from('org_compliance_blocks')
        .select('id')
        .eq('organization_id', orgId)
        .eq('gate_key', frameworkGate)
        .is('resolved_at', null)
        .limit(1);

      if (!existingFw || existingFw.length === 0) {
        await supabase.from('org_compliance_blocks').insert({
          organization_id: orgId,
          gate_key: frameworkGate,
          reason,
          created_by: null,
          metadata: {
            framework: frameworkCode,
            missingCodes: missingMandatoryCodes.slice(0, 50),
          },
        });
      }
    }
  } else {
    await supabase
      .from('org_compliance_blocks')
      .update({ resolved_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .in(
        'gate_key',
        frameworkGate
          ? ['AUDIT_EXPORT', 'CERT_REPORT', frameworkGate]
          : ['AUDIT_EXPORT', 'CERT_REPORT'],
      )
      .is('resolved_at', null);

    await safeLogActivity(
      orgId,
      'compliance_resolved',
      `Resolved compliance blocks for ${frameworkCode}`,
      {
        frameworkCode,
      },
    );
  }

  await safeLogActivity(
    orgId,
    'control_evaluated',
    `Compliance blocks refreshed for ${frameworkCode}`,
    {
      frameworkCode,
      missingMandatoryCount: missingMandatoryCodes.length,
    },
  );

  await logAuditEventCore({
    organizationId: orgId,
    actorUserId: null,
    actorRole: 'system',
    entityType: 'compliance_block',
    entityId: null,
    actionType:
      missingMandatoryCodes.length > 0
        ? 'COMPLIANCE_BLOCK_CREATED'
        : 'COMPLIANCE_BLOCK_RESOLVED',
    afterState: {
      frameworkCode,
      missingMandatoryCount: missingMandatoryCodes.length,
    },
    reason: 'automated_enforcement',
  });
}

export async function evaluateFrameworkControlsCore(
  orgId: string,
  frameworkCode: string,
) {
  try {
    if (!orgId || !frameworkCode) return null;
    const supabase = await createSupabaseServerClient();
    const correlationId = createCorrelationId();
    await requireEntitlement(orgId, 'framework_evaluations');

    const { data: previousStatus } = await supabase
      .from('org_compliance_status')
      .select('last_score')
      .eq('organization_id', orgId)
      .maybeSingle();

    const { data: framework, error: fwErr } = await supabase
      .from('compliance_frameworks')
      // Schema column is `name` (audit database-017). Alias for API stability.
      .select('id, code, title:name')
      .eq('code', frameworkCode)
      .maybeSingle();

    if (fwErr || !framework?.id) return null;

    const controls = await safeSelectControls(supabase, framework.id);
    if (!controls.length) return null;

    const controlIds = controls.map((c: { id: string }) => c.id);
    const [evidenceRows, controlTaskRows] = await Promise.all([
      safeSelectControlEvidence(supabase, orgId, controlIds),
      safeSelectControlTasks(supabase, orgId, controlIds),
    ]);

    const taskIds = Array.from(
      new Set(controlTaskRows.map((row) => row.task_id).filter(Boolean)),
    );
    const tasks = await safeSelectTasksByIds(supabase, orgId, taskIds);
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

    const evaluatedAt = new Date().toISOString();
    const evaluations: EvaluationRow[] = [];
    const missingMandatoryCodes: string[] = [];
    const atRiskCodes: string[] = [];
    // Tier 2.A: collected for auto-CAPA. Populated only when the
    // registry evaluator returns status='fail' AND the engine status
    // settled to non_compliant — so partial-band findings don't open
    // CAPAs they shouldn't.
    const failingControls: FailingControl[] = [];
    let totalWeight = 0;
    let weightedScore = 0;
    let compliantCount = 0;
    let atRiskCount = 0;
    let nonCompliantCount = 0;
    let notApplicableCount = 0;

    // Audit compliance-004 (2026-05-22): wire registry evaluators
    // into the heuristic pipeline. When a control has a registered
    // evaluator for `(framework_slug, control_code)`, its DB-signal
    // verdict overrides the evidence-count heuristic. Bootstrap
    // happens once per process (registerAllEvaluators is idempotent).
    registerAllEvaluators();
    const frameworkSlug = getFrameworkSlugForCode(
      framework.code as string,
    ) as FrameworkSlug | null;
    const adminClient = frameworkSlug ? createSupabaseAdminClient() : null;

    for (const control of controls as ControlRow[]) {
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

      const overdueTaskCount = taskList.filter((t) => isTaskOverdue(t)).length;
      const openTaskCount = taskList.filter((t) => !isTaskComplete(t)).length;

      const evidenceSatisfied =
        requiredEvidence <= 0 || approvedEvidenceCount >= requiredEvidence;
      const hasEvidencePending = pendingEvidenceCount > 0;
      const hasEvidenceRejected = rejectedEvidenceCount > 0;

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
      } else if (hasEvidenceRejected && !evidenceSatisfied) {
        status = 'at_risk';
      } else if (
        !evidenceSatisfied ||
        hasEvidencePending ||
        openTaskCount > 0
      ) {
        status = 'at_risk';
      }

      // Audit compliance-004: registry overlay. When an evaluator is
      // registered for this control we trust its DB-signal verdict
      // over the evidence-count heuristic. `not_applicable` controls
      // are skipped (they aren't part of the org's scope) and
      // `not_evaluated` evaluator results leave the heuristic intact.
      let evaluatorResult: ControlResult | null = null;
      if (
        frameworkSlug &&
        adminClient &&
        status !== 'not_applicable' &&
        getEvaluator(frameworkSlug, control.code)
      ) {
        evaluatorResult = await runControlEvaluation(
          { orgId, db: adminClient },
          frameworkSlug,
          control.code,
        );
        const overlaid = evaluatorStatusToEngineStatus(evaluatorResult);
        if (overlaid !== null) {
          status = overlaid;
        }
        // Tier 2.A: track evaluator-driven failures for CAPA creation.
        // Only when the evaluator itself says 'fail' — we don't open a
        // CAPA just because the heuristic settled on non_compliant
        // (those usually mean "evidence missing" which the existing
        // task / evidence workflows already handle).
        if (evaluatorResult.status === 'fail') {
          failingControls.push({
            controlId: control.id,
            controlCode: control.code,
            controlTitle: control.title ?? null,
            frameworkSlug,
            result: evaluatorResult,
          });
        }
      }

      if (isMandatory && status === 'non_compliant') {
        missingMandatoryCodes.push(control.code);
      }
      if (status === 'at_risk') {
        atRiskCodes.push(control.code);
      }

      if (status === 'compliant') compliantCount++;
      if (status === 'at_risk') atRiskCount++;
      if (status === 'non_compliant') nonCompliantCount++;
      if (status === 'not_applicable') notApplicableCount++;

      if (status !== 'not_applicable') {
        totalWeight += weight * riskWeight;
        weightedScore += weight * riskWeight * scoreFromStatus(status);
      }

      evaluations.push({
        organization_id: orgId,
        entity_id: entityId,
        control_type: 'framework_control',
        control_key: `control:${control.id}`,
        required: isMandatory,
        status,
        last_evaluated_at: evaluatedAt,
        details: {
          control_id: control.id,
          framework_id: framework.id,
          framework_code: framework.code,
          code: control.code,
          title: control.title,
          category: control.category || 'General',
          risk_level: riskLevel,
          weight,
          required_evidence_count: requiredEvidence,
          approved_evidence_count: approvedEvidenceCount,
          pending_evidence_count: pendingEvidenceCount,
          rejected_evidence_count: rejectedEvidenceCount,
          open_task_count: openTaskCount,
          overdue_task_count: overdueTaskCount,
          // Audit compliance-004: surface registry verdict alongside
          // the heuristic so audits can see WHY a control flipped.
          evaluator: evaluatorResult
            ? {
                framework_slug: frameworkSlug,
                status: evaluatorResult.status,
                reason: evaluatorResult.reason ?? null,
                confidence: evaluatorResult.confidence,
                gap_codes: evaluatorResult.gaps.map((g) => g.code),
                evidence_count: evaluatorResult.evidenceRefs.length,
              }
            : null,
        },
      });
    }

    await upsertEvaluations(supabase, evaluations);
    await logEvaluationAudit(supabase, orgId, evaluations);

    // Tier 2.A: open CAPAs for evaluator-fail rows. Best-effort —
    // failures don't block the evaluation response. autoCreate uses
    // the admin client because RLS on org_capa_items requires an
    // authenticated context that this server-side path doesn't always
    // have (cron-triggered evaluations).
    if (failingControls.length > 0 && adminClient) {
      try {
        await autoCreateCapaFromFailures(adminClient, {
          orgId,
          failures: failingControls,
          createdBy: null,
        });
      } catch {
        // already logged in autoCreateCapaFromFailures; swallow to
        // protect the evaluation response.
      }
    }

    const score =
      totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    const snapshotStatus: ControlStatus =
      score === 100 ? 'compliant' : score >= 80 ? 'at_risk' : 'non_compliant';

    const snapshotPayload = JSON.stringify({
      orgId,
      frameworkCode: framework.code,
      score,
      evaluatedAt,
      missingMandatoryCodes,
    });

    // v4-031: previously these two writes silently swallowed any error,
    // so a schema mismatch returned a "successful" evaluation with no
    // snapshot and no posture row. Capture to Sentry with structured
    // context so on-call can correlate the missing snapshot with the
    // run that produced it. Evaluation continues — these are reporting
    // tables, not the source of truth for control state.
    {
      const { error: snapshotError } = await supabase
        .from('org_control_evaluations')
        .insert({
          organization_id: orgId,
          control_type: 'framework_snapshot',
          control_key: `framework:${framework.code}:${evaluatedAt}`,
          required: true,
          status: snapshotStatus,
          last_evaluated_at: evaluatedAt,
          framework_id: framework.id,
          compliance_score: score,
          total_controls: controls.length,
          satisfied_controls: evaluations.filter(
            (e) => e.status === 'compliant',
          ).length,
          missing_controls: evaluations.filter(
            (e) => e.status === 'non_compliant',
          ).length,
          missing_control_codes: missingMandatoryCodes,
          partial_control_codes: atRiskCodes,
          evaluated_by: null,
          snapshot_hash: stableHash(snapshotPayload),
          evaluated_at: evaluatedAt,
          details: {
            framework_code: framework.code,
            missing_mandatory_codes: missingMandatoryCodes,
          },
        });
      if (snapshotError) {
        Sentry.captureException(snapshotError, {
          tags: {
            module: 'compliance.evaluator',
            operation: 'snapshot_insert',
            framework_code: framework.code,
          },
          extra: {
            orgId,
            correlationId,
            evaluatedAt,
            controlCount: controls.length,
          },
        });
        consoleShim.warn(
          '[compliance.evaluator] snapshot insert failed',
          snapshotError.message,
        );
      }
    }

    {
      const { error: statusError } = await supabase
        .from('org_compliance_status')
        .upsert({
          organization_id: orgId,
          last_framework_code: framework.code,
          last_score: score,
          last_total_controls: controls.length,
          last_missing_controls: nonCompliantCount,
          last_partial_controls: atRiskCount,
          last_evaluated_at: evaluatedAt,
          updated_at: new Date().toISOString(),
        });
      if (statusError) {
        Sentry.captureException(statusError, {
          tags: {
            module: 'compliance.evaluator',
            operation: 'status_upsert',
            framework_code: framework.code,
          },
          extra: { orgId, correlationId, evaluatedAt },
        });
        consoleShim.warn(
          '[compliance.evaluator] status upsert failed',
          statusError.message,
        );
      }
    }

    const previousScore =
      typeof previousStatus?.last_score === 'number'
        ? previousStatus.last_score
        : null;
    const scoreDelta = previousScore == null ? null : score - previousScore;

    await logProductActivity(
      orgId,
      null,
      'updated',
      {
        type: 'compliance_score',
        id: framework.id,
        name: framework.code,
        path: '/app/compliance/frameworks',
      },
      {
        frameworkCode: framework.code,
        score,
        previousScore,
        scoreDelta,
        missingMandatoryCodes,
      },
    );

    if (scoreDelta != null && scoreDelta !== 0) {
      await notify(
        orgId,
        { roles: ['owner', 'admin'] },
        {
          type:
            scoreDelta > 0
              ? 'compliance.score_improved'
              : 'compliance.score_dropped',
          title:
            scoreDelta > 0
              ? 'Compliance score improved'
              : 'Compliance score dropped',
          body: `${framework.code} moved from ${previousScore} to ${score}.`,
          priority: scoreDelta < 0 ? 'high' : 'normal',
          data: {
            href: '/app/compliance/frameworks',
            frameworkCode: framework.code,
            score,
            previousScore,
            scoreDelta,
            dedupeKey: `compliance.score:${orgId}:${framework.code}:${evaluatedAt}`,
          },
        },
      );
    }

    await refreshComplianceBlocks(
      supabase,
      orgId,
      framework.code,
      missingMandatoryCodes,
    );

    try {
      await logAuditEventCore({
        organizationId: orgId,
        actorUserId: null,
        actorRole: 'system',
        entityType: 'framework',
        entityId: framework.id,
        actionType: 'FRAMEWORK_EVALUATED',
        afterState: {
          frameworkCode: framework.code,
          score,
          totalControls: controls.length,
          missingMandatory: missingMandatoryCodes.length,
          correlation_id: correlationId,
        },
        reason: 'evaluation',
      });
    } catch (auditError) {
      // v4-031: SOC 2 CC7.2 requires evaluation events be logged.
      // Capture the failure but do not break the evaluation result —
      // the score is already returned to the caller and persisted
      // above. On-call must triage these in Sentry.
      Sentry.captureException(auditError, {
        tags: {
          module: 'compliance.evaluator',
          operation: 'audit_log',
          framework_code: framework.code,
        },
        extra: { orgId, correlationId, evaluatedAt },
      });
      consoleShim.warn(
        '[compliance.evaluator] FRAMEWORK_EVALUATED audit log failed',
        auditError instanceof Error ? auditError.message : auditError,
      );
    }

    return {
      frameworkId: framework.id as string,
      frameworkCode: framework.code as string,
      score,
      missingMandatoryCodes,
      totalControls: controls.length,
      compliantCount,
      atRiskCount,
      nonCompliantCount,
      notApplicableCount,
      partialCodes: atRiskCodes,
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
