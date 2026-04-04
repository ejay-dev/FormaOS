import { NextResponse } from 'next/server';
import {
  authenticateV1Request,
  createEnvelope,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import {
  getIntegrationStatus,
  listAvailableIntegrations,
  listConnectedIntegrations,
} from '@/lib/integrations/manager';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['integrations:read'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') ?? 'all';
    const [catalog, connected, status] = await Promise.all([
      view === 'connected'
        ? Promise.resolve([])
        : Promise.resolve(listAvailableIntegrations()),
      view === 'catalog'
        ? Promise.resolve([])
        : listConnectedIntegrations(auth.context.orgId),
      view === 'catalog'
        ? Promise.resolve([])
        : getIntegrationStatus(auth.context.orgId),
    ]);

    await logV1Access(auth.context, 200, 'integrations:read');
    return jsonWithContext(
      auth.context,
      createEnvelope({
        catalog,
        connected,
        status,
      }),
    );
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
