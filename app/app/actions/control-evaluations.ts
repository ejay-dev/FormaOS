'use server';

/**
 * Audit server-actions-001 (2026-05-22) — wrapper layer.
 *
 * This file is the server-action surface for the control-evaluation
 * entrypoints. Each exported function enforces caller authz
 * (session→orgId match) and delegates the actual work to the
 * lib-level cores in `@/lib/compliance/*`.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { actionError, isNextInternalError } from '@/lib/actions/safe';
import { getUserOrgMembership } from '@/app/app/actions/rbac';
import { evaluateOrgComplianceCore } from '@/lib/compliance/evaluate-org-compliance';
import {
  fetchComplianceSummaryCore,
  fetchComplianceSummaryStrictCore,
} from '@/lib/compliance/fetch-compliance-summary';

async function assertCallerOwnsOrg(orgId: string) {
  const membership = await getUserOrgMembership();
  if (membership.orgId !== orgId) {
    throw new Error(
      `Access denied: cross-organization compliance request (caller=${membership.orgId}, target=${orgId})`,
    );
  }
  return membership;
}

export async function evaluateOrgCompliance(orgId: string) {
  if (!orgId) return;
  await assertCallerOwnsOrg(orgId);
  return evaluateOrgComplianceCore(orgId);
}

export async function fetchComplianceSummary(orgId: string) {
  if (!orgId) {
    return {
      total: 0,
      compliant: 0,
      atRisk: 0,
      nonCompliant: 0,
      requiredNonCompliant: 0,
    };
  }
  await assertCallerOwnsOrg(orgId);
  return fetchComplianceSummaryCore(orgId);
}

export async function fetchComplianceSummaryStrict(orgId: string) {
  if (!orgId) {
    throw new Error('Organization context missing');
  }
  await assertCallerOwnsOrg(orgId);
  return fetchComplianceSummaryStrictCore(orgId);
}

/**
 * Caller-context entrypoint — resolves orgId from the session and
 * proxies to the strict summary core. Safe to call from anywhere; it
 * never accepts an orgId argument, so cross-tenant forgery is not
 * possible here.
 */
export async function fetchRequiredNonCompliantCount() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    try {
      const { data: membership, error } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !membership?.organization_id) return 0;

      const summary = await fetchComplianceSummaryCore(
        membership.organization_id,
      );
      if ('error' in summary) return 0;
      return summary.requiredNonCompliant;
    } catch {
      return 0;
    }
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
