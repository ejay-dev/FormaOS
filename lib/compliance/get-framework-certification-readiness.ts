/**
 * Audit server-actions-002 (2026-05-22): lib-level core for framework
 * certification readiness. Does NOT verify caller authz — the server-
 * action wrapper at `@/app/app/actions/compliance-engine` enforces the
 * session→orgId match before delegating here.
 */

import { actionError, isNextInternalError } from '@/lib/actions/safe';
import { getOrgComplianceSnapshotCore } from '@/lib/compliance/get-org-compliance-snapshot';

export async function getFrameworkCertificationReadinessCore(orgId: string) {
  try {
    const snapshot = await getOrgComplianceSnapshotCore(orgId);
    if ('error' in snapshot) throw new Error(snapshot.error);
    const readinessByFramework: Record<
      string,
      {
        missing: string[];
        atRisk: string[];
        requiredEvidence: number;
        openTasks: number;
      }
    > = {};

    for (const violation of snapshot.openViolations) {
      if (!readinessByFramework[violation.frameworkCode]) {
        readinessByFramework[violation.frameworkCode] = {
          missing: [],
          atRisk: [],
          requiredEvidence: 0,
          openTasks: 0,
        };
      }
      const bucket = readinessByFramework[violation.frameworkCode];
      if (violation.status === 'non_compliant')
        bucket.missing.push(violation.code);
      if (violation.status === 'at_risk') bucket.atRisk.push(violation.code);

      const missingEvidence = Math.max(
        0,
        violation.requiredEvidenceCount - violation.approvedEvidenceCount,
      );
      bucket.requiredEvidence += missingEvidence;
      bucket.openTasks += violation.openTaskCount;
    }

    return snapshot.frameworkBreakdown.map((fw) => {
      const stats = readinessByFramework[fw.frameworkCode] || {
        missing: [],
        atRisk: [],
        requiredEvidence: 0,
        openTasks: 0,
      };
      let status: 'certifiable' | 'conditionally_ready' | 'blocked' =
        'certifiable';
      if (stats.missing.length > 0) status = 'blocked';
      else if (
        stats.atRisk.length > 0 ||
        stats.requiredEvidence > 0 ||
        stats.openTasks > 0
      )
        status = 'conditionally_ready';

      return {
        frameworkId: fw.frameworkId,
        frameworkCode: fw.frameworkCode,
        frameworkTitle: fw.frameworkTitle,
        status,
        missingControls: stats.missing,
        atRiskControls: stats.atRisk,
        requiredEvidence: stats.requiredEvidence,
        openRemediationTasks: stats.openTasks,
      };
    });
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
