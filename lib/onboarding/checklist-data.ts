import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ChecklistCompletionCounts } from '@/lib/onboarding/industry-checklists';
import { getSupabaseErrorMessage } from '@/lib/supabase/schema-compat';

async function safeCount(
  label: string,
  query: PromiseLike<{ count: number | null; error?: unknown }>,
): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) {
      const message = getSupabaseErrorMessage(error as { message?: string | null });
      if (message) {
        console.warn(`[onboarding] count query error (${label})`, error);
      }
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.warn(`[onboarding] count query failed (${label})`, error);
    return 0;
  }
}

export async function getChecklistCountsForOrg(
  orgId: string,
): Promise<ChecklistCompletionCounts> {
  const admin = createSupabaseAdminClient();

  const [
    tasks,
    evidence,
    members,
    complianceChecks,
    reports,
    frameworks,
    policies,
    incidents,
    registerRows,
    assetRows,
    workflows,
    patients,
  ] = await Promise.all([
    safeCount(
      'org_tasks',
      admin
        .from('org_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_evidence',
      admin
        .from('org_evidence')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_members',
      admin
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_control_evaluations',
      admin
        .from('org_control_evaluations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'reports',
      admin
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_frameworks',
      admin
        .from('org_frameworks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_policies',
      admin
        .from('org_policies')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_incidents',
      admin
        .from('org_incidents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_registers',
      admin
        .from('org_registers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_assets',
      admin
        .from('org_assets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_workflows',
      admin
        .from('org_workflows')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      'org_patients',
      admin
        .from('org_patients')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
  ]);

  const { data: org } = await admin
    .from('organizations')
    .select('name, industry, team_size, plan_key')
    .eq('id', orgId)
    .maybeSingle();

  const orgProfileComplete = Boolean(
    org?.name && org?.industry && org?.team_size && org?.plan_key,
  );

  return {
    tasks,
    evidence,
    members,
    complianceChecks,
    reports,
    frameworks,
    policies,
    incidents,
    registers: registerRows + assetRows,
    workflows,
    patients,
    orgProfileComplete,
  };
}
