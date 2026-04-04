import { NextResponse } from 'next/server';
import {
  authenticateV1Request,
  createEnvelope,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import {
  getIntegrationEventHistory,
  type IntegrationType,
} from '@/lib/integrations/manager';

type RouteContext = { params: Promise<{ integrationId: IntegrationType }> };

export const runtime = 'nodejs';

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['integrations:read'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { integrationId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number(searchParams.get('limit') ?? '50'), 1),
      100,
    );
    const history = await getIntegrationEventHistory(
      auth.context.orgId,
      integrationId,
      limit,
    );

    await logV1Access(auth.context, 200, 'integrations:read');
    return jsonWithContext(auth.context, createEnvelope(history));
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
