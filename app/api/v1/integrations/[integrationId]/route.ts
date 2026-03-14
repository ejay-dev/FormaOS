import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { connectIntegration, disconnectIntegration, testIntegration, type IntegrationType } from '@/lib/integrations/manager';
import { getActorId } from '@/lib/api/v1-helpers';

type RouteContext = { params: Promise<{ integrationId: IntegrationType }> };

export const runtime = 'nodejs';

export async function POST(request: Request, context: RouteContext) {
  const { integrationId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; config?: unknown }
    | null;
  const action = typeof body?.action === 'string' ? body.action : 'connect';

  if (action === 'test') {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['integrations:write'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    const result = await testIntegration(auth.context.orgId, integrationId);
    await logV1Access(auth.context, 200, 'integrations:write');
    return jsonWithContext(auth.context, createEnvelope(result));
  }

  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['integrations:write'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const config =
    body?.config && typeof body.config === 'object' && !Array.isArray(body.config)
      ? (body.config as Record<string, unknown>)
      : {};

  const result = await connectIntegration({
    orgId: auth.context.orgId,
    type: integrationId,
    config,
    actorUserId: getActorId(auth.context),
  });

  await logV1Access(auth.context, 200, 'integrations:write');
  return jsonWithContext(auth.context, createEnvelope(result));
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateV1Request(request, {
    requireAdmin: true,
    requiredScopes: ['integrations:write'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { integrationId } = await context.params;
  const connected = await (await import('@/lib/integrations/manager')).listConnectedIntegrations(
    auth.context.orgId,
  );
  const target = connected.find(
    (item: { provider: string; id: string }) => item.provider === integrationId,
  );

  if (!target) {
    const response = jsonWithContext(auth.context, { error: 'Integration not connected' }, { status: 404 });
    await logV1Access(auth.context, 404, 'integrations:write');
    return response;
  }

  await disconnectIntegration({
    orgId: auth.context.orgId,
    integrationId: target.id,
    actorUserId: getActorId(auth.context),
  });

  await logV1Access(auth.context, 200, 'integrations:write');
  return jsonWithContext(auth.context, createEnvelope({ ok: true }));
}
