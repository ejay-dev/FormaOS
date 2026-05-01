import {
  jsonWithContext,
  type V1AuthContext,
} from '@/lib/api-keys/middleware';

export async function requireCustomReportsEntitlement(
  context: V1AuthContext,
) {
  const { data: entitlement, error } = await context.db
    .from('org_entitlements')
    .select('enabled')
    .eq('organization_id', context.orgId)
    .eq('feature_key', 'custom_reports')
    .maybeSingle();

  if (error || entitlement?.enabled !== true) {
    return jsonWithContext(
      context,
      {
        error: {
          message: 'Custom reports require a Growth or Enterprise entitlement',
        },
      },
      { status: 403 },
    );
  }

  return null;
}
