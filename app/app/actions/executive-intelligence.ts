"use server";

import { getOrgComplianceSnapshot } from "@/app/app/actions/compliance-engine";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

function riskProbability(score: number) {
  if (score >= 90) return 0.1;
  if (score >= 75) return 0.3;
  if (score >= 60) return 0.6;
  return 0.85;
}

export async function generateExecutiveRiskNarrative(reason?: string) {
  const permissionCtx = await requirePermission("VIEW_AUDIT_LOGS");
  const snapshot = await getOrgComplianceSnapshot(permissionCtx.orgId);

  const weakestFrameworks = [...snapshot.frameworkBreakdown]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const topRisks = snapshot.highRiskControls.slice(0, 5);

  const narrative = [
    `Overall compliance score is ${snapshot.overallScore}%.`,
    weakestFrameworks.length
      ? `Weakest frameworks: ${weakestFrameworks.map((f) => `${f.frameworkCode} (${f.score}%)`).join(", ")}.`
      : "No framework scores available.",
    topRisks.length
      ? `Top risk drivers: ${topRisks.map((r) => `${r.code} (${r.riskLevel})`).join(", ")}.`
      : "No high-risk controls flagged.",
    snapshot.forecast.projectedScoreIn21Days !== null
      ? `Projected compliance in 21 days: ${snapshot.forecast.projectedScoreIn21Days}%.`
      : "Forecast unavailable due to insufficient remediation velocity.",
    `Estimated audit failure probability: ${Math.round(riskProbability(snapshot.overallScore) * 100)}%.`,
  ];

  await logAuditEvent({
    organizationId: permissionCtx.orgId,
    actorUserId: permissionCtx.userId,
    actorRole: permissionCtx.role,
    entityType: "executive_summary",
    entityId: null,
    actionType: "EXECUTIVE_RISK_NARRATIVE_GENERATED",
    afterState: { overallScore: snapshot.overallScore, frameworkCount: snapshot.frameworkBreakdown.length },
    reason: reason && reason.trim().length ? reason.trim() : "executive_summary",
  });

  return {
    snapshot,
    narrative,
    topRiskDrivers: topRisks,
    weakestFrameworks,
    auditFailureProbability: riskProbability(snapshot.overallScore),
  };
}
