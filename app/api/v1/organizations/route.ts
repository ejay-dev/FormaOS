import { NextResponse } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { createEnvelope } from '@/lib/api-keys/middleware';
import { countRows } from '@/lib/api/v1-helpers';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/organizations');

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['organizations:read'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Column allowlist — never SELECT * on the organizations table.
    // Hidden columns (is_active, created_by, plan_selected_at,
    // onboarding_completed_at, industry_code, *_at activation marks)
    // are internal state and not part of the public v1 contract.
    const ORG_PUBLIC_COLUMNS =
      'id, name, industry, plan_key, created_at, data_residency_region';

    const [organization, memberCount, frameworkCount, apiKeyCount] =
      await Promise.all([
        auth.context.db
          .from('organizations')
          .select(ORG_PUBLIC_COLUMNS)
          .eq('id', auth.context.orgId)
          .maybeSingle(),
        countRows('org_members', (query) =>
          query.eq('organization_id', auth.context.orgId),
        ),
        countRows('org_frameworks', (query) =>
          query.eq('organization_id', auth.context.orgId),
        ),
        countRows('api_keys', (query) =>
          query.eq('org_id', auth.context.orgId).is('revoked_at', null),
        ),
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
  } catch (error) {
    log.error({ err: error }, '[V1 API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
