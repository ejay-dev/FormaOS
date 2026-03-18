import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getOrgDataRegion,
  getRegionConfig,
  type DataRegion,
} from '@/lib/data-residency';
import { logIdentityEvent } from '@/lib/identity/audit';

export type ResidencyOperation =
  | 'read'
  | 'write'
  | 'export'
  | 'replicate'
  | 'transfer';

export interface ResidencyEnforcementInput {
  destinationRegion?: DataRegion | null;
  sourceRegion?: DataRegion | null;
  resourceType?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

export async function enforceResidency(
  orgId: string,
  operation: ResidencyOperation,
  input: ResidencyEnforcementInput = {},
) {
  const orgRegion = await getOrgDataRegion(orgId);
  const destination = input.destinationRegion ?? orgRegion;
  const source = input.sourceRegion ?? orgRegion;
  const allowed = destination === orgRegion && source === orgRegion;

  if (!allowed) {
    const admin = createSupabaseAdminClient();
    await admin.from('data_residency_violations').insert({
      org_id: orgId,
      operation,
      source_region: source,
      destination_region: destination,
      resource_type: input.resourceType ?? null,
      reason: input.reason ?? 'Cross-region transfer blocked by residency policy',
      metadata: input.metadata ?? {},
      created_at: new Date().toISOString(),
    });

    await logIdentityEvent({
      eventType: 'governance.residency.violation',
      actorType: 'system',
      orgId,
      result: 'failure',
      metadata: {
        operation,
        source_region: source,
        destination_region: destination,
        resource_type: input.resourceType ?? null,
      },
    });

    throw new Error(
      `Cross-region ${operation} blocked. Org region ${orgRegion} cannot transfer to ${destination}.`,
    );
  }

  return {
    allowed: true,
    region: orgRegion,
    routeHint: getRegionConfig(orgRegion),
  };
}

export async function listResidencyViolations(orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('data_residency_violations')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
