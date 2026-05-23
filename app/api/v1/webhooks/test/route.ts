import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { getActorId } from '@/lib/api/v1-helpers';
import { sendTestWebhookEvent } from '@/lib/webhooks/delivery-queue';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // v4-031: test deliveries can be expensive (network egress, retries,
  // downstream side-effects). Gate on requireAdmin so a non-admin holding
  // `webhooks:manage` via a custom scope grant cannot trigger them.
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['webhooks:manage'],
    requireAdmin: true,
  });

  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as
    | { webhookId?: unknown }
    | null;
  const webhookId =
    typeof body?.webhookId === 'string' ? body.webhookId.trim() : '';

  if (!webhookId) {
    const response = jsonWithContext(auth.context, { error: 'webhookId is required' }, { status: 400 });
    await logV1Access(auth.context, 400, 'webhooks:manage');
    return response;
  }

  const queued = await sendTestWebhookEvent({
    orgId: auth.context.orgId,
    webhookId,
    actorId: getActorId(auth.context),
  });

  await logV1Access(auth.context, 202, 'webhooks:manage');
  return jsonWithContext(auth.context, createEnvelope(queued), { status: 202 });
}
