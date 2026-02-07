import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ChecklistCompletionCounts } from '@/lib/onboarding/industry-checklists';

async function safeCount(
  query: Promise<{ count: number | null; error?: any }>,
): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) {
      console.warn('[onboarding] count query error', error);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.warn('[onboarding] count query failed', error);
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
      admin
        .from('org_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_evidence')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_control_evaluations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_frameworks')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId),
    ),
    safeCount(
      admin
        .from('org_policies')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_incidents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_registers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_assets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_workflows')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
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
