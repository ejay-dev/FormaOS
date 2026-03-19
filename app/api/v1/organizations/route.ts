import { authenticateV1Request, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { createEnvelope } from '@/lib/api-keys/middleware';
import { countRows } from '@/lib/api/v1-helpers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['organizations:read'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const [organization, memberCount, frameworkCount, apiKeyCount] = await Promise.all([
    auth.context.db
      .from('organizations')
      .select('*')
      .eq('id', auth.context.orgId)
      .maybeSingle(),
    countRows('org_members', (query) => query.eq('organization_id', auth.context.orgId)),
    countRows('org_frameworks', (query) => query.eq('organization_id', auth.context.orgId)),
    countRows('api_keys', (query) => query.eq('org_id', auth.context.orgId).is('revoked_at', null)),
  ]);

  const payload = createEnvelope({
    ...(organization.data ?? {}),
    stats: {
      memberCount,
      frameworkCount,
      apiKeyCount,
    },
  });

  await logV1Access(auth.context, 200, 'organizations:read');
  return jsonWithContext(auth.context, payload);
}
