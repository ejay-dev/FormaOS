'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createEnterpriseExportJob } from '@/lib/export/enterprise-export';
import { requireEntitlement } from '@/lib/billing/entitlements';

type ExportKind = 'proof_packet_14d' | 'monthly_exec_pack' | 'audit_ready_bundle';

export async function createGovernanceExportAction(kind: ExportKind): Promise<{
  ok: boolean;
  jobId?: string;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Unauthorized' };

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  const orgId = (membership as any)?.organization_id as string | undefined;
  const role = (membership as any)?.role as string | undefined;

  if (!orgId || !role) return { ok: false, error: 'Organization not found' };
  if (!['owner', 'admin'].includes(role)) return { ok: false, error: 'Admin access required' };

  // Governance exports are premium artifacts: require active subscription + audit export entitlement.
  await requireEntitlement(orgId, 'audit_export');

  const baseOptions = {
    includeCompliance: true,
    includeEvidence: true,
    includeAuditLogs: true,
    includeCareOps: true,
    includeTeam: true,
    includeReportPdfs: true,
  } as const;

  const options =
    kind === 'proof_packet_14d'
      ? {
          ...baseOptions,
          bundleType: 'proof_packet_14d' as const,
          dateRangeDays: 14,
          includeTeam: false,
        }
      : kind === 'monthly_exec_pack'
        ? {
            ...baseOptions,
            bundleType: 'monthly_exec_pack' as const,
            dateRangeDays: 30,
          }
        : {
            ...baseOptions,
            bundleType: 'audit_ready_bundle' as const,
            dateRangeDays: 90,
          };

  const res = await createEnterpriseExportJob(orgId, user.id, options as any);
  if (!res.ok || !res.jobId) {
    return { ok: false, error: res.error ?? 'Failed to create export job' };
  }

  return { ok: true, jobId: res.jobId };
}

