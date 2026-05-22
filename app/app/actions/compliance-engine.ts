'use server';

/**
 * Audit server-actions-002 (2026-05-22) — wrapper layer.
 *
 * This file is the server-action surface for the compliance-engine
 * entrypoints. Each exported function enforces caller authz
 * (session→orgId match) and delegates the actual work to the
 * lib-level cores in `@/lib/compliance/*`.
 */

import { getUserOrgMembership } from '@/app/app/actions/rbac';
import { evaluateFrameworkControlsCore } from '@/lib/compliance/evaluate-framework-controls';
import { getOrgComplianceSnapshotCore } from '@/lib/compliance/get-org-compliance-snapshot';
import { getFrameworkCertificationReadinessCore } from '@/lib/compliance/get-framework-certification-readiness';

async function assertCallerOwnsOrg(orgId: string) {
  const membership = await getUserOrgMembership();
  if (membership.orgId !== orgId) {
    throw new Error(
      `Access denied: cross-organization compliance request (caller=${membership.orgId}, target=${orgId})`,
    );
  }
  return membership;
}

export async function evaluateFrameworkControls(
  orgId: string,
  frameworkCode: string,
) {
  if (!orgId || !frameworkCode) return null;
  await assertCallerOwnsOrg(orgId);
  return evaluateFrameworkControlsCore(orgId, frameworkCode);
}

export async function getOrgComplianceSnapshot(
  orgId: string,
  strict: boolean = false,
) {
  if (!orgId) {
    return getOrgComplianceSnapshotCore(orgId, strict);
  }
  await assertCallerOwnsOrg(orgId);
  return getOrgComplianceSnapshotCore(orgId, strict);
}

export async function getFrameworkCertificationReadiness(orgId: string) {
  await assertCallerOwnsOrg(orgId);
  return getFrameworkCertificationReadinessCore(orgId);
}
