/**
 * Audit server-actions-001 (2026-05-22): lib-level core for compliance
 * summary reads. Does NOT verify caller authz — the server-action
 * wrapper at `@/app/app/actions/control-evaluations` enforces the
 * session→orgId match before delegating here. Calling this directly is
 * only safe from server-only code paths that already have a trusted
 * orgId.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { actionError, isNextInternalError } from '@/lib/actions/safe';

export async function fetchComplianceSummaryCore(orgId: string) {
  try {
    if (!orgId) {
      return {
        total: 0,
        compliant: 0,
        atRisk: 0,
        nonCompliant: 0,
        requiredNonCompliant: 0,
      };
    }
    const supabase = await createSupabaseServerClient();

    try {
      const { data, error } = await supabase
        .from('org_control_evaluations')
        .select('status, required')
        .eq('organization_id', orgId);

      if (error || !data) {
        return {
          total: 0,
          compliant: 0,
          atRisk: 0,
          nonCompliant: 0,
          requiredNonCompliant: 0,
        };
      }

      const total = data.length;
      const compliant = data.filter(
        (r: { status: string; required?: boolean }) => r.status === 'compliant',
      ).length;
      const atRisk = data.filter(
        (r: { status: string; required?: boolean }) => r.status === 'at_risk',
      ).length;
      const nonCompliant = data.filter(
        (r: { status: string; required?: boolean }) =>
          r.status === 'non_compliant',
      ).length;
      const requiredNonCompliant = data.filter(
        (r: { status: string; required?: boolean }) =>
          r.required && r.status === 'non_compliant',
      ).length;

      return {
        total,
        compliant,
        atRisk,
        nonCompliant,
        requiredNonCompliant,
      };
    } catch {
      return {
        total: 0,
        compliant: 0,
        atRisk: 0,
        nonCompliant: 0,
        requiredNonCompliant: 0,
      };
    }
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function fetchComplianceSummaryStrictCore(orgId: string) {
  try {
    if (!orgId) {
      throw new Error('Organization context missing');
    }
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('org_control_evaluations')
      .select('status, required')
      .eq('organization_id', orgId);

    if (error || !data) {
      throw new Error('Compliance summary lookup failed');
    }

    const total = data.length;
    const compliant = data.filter(
      (r: { status: string; required?: boolean }) => r.status === 'compliant',
    ).length;
    const atRisk = data.filter(
      (r: { status: string; required?: boolean }) => r.status === 'at_risk',
    ).length;
    const nonCompliant = data.filter(
      (r: { status: string; required?: boolean }) =>
        r.status === 'non_compliant',
    ).length;
    const requiredNonCompliant = data.filter(
      (r: { status: string; required?: boolean }) =>
        r.required && r.status === 'non_compliant',
    ).length;

    return {
      total,
      compliant,
      atRisk,
      nonCompliant,
      requiredNonCompliant,
    };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
