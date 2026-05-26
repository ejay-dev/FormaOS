import { z } from 'zod';
import { authenticateV1Request, createEnvelope, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { getActorId } from '@/lib/api/v1-helpers';
import { sendTestWebhookEvent } from '@/lib/webhooks/delivery-queue';
import {
  formatZodError,
  uuidSchema,
  validateBody,
} from '@/lib/security/api-validation';

const testWebhookSchema = z.object({
  webhookId: uuidSchema,
});

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

  const validation = await validateBody(request, testWebhookSchema);
  if (!validation.success) {
    const response = jsonWithContext(
      auth.context,
      formatZodError(validation.error),
      { status: 400 },
    );
    await logV1Access(auth.context, 400, 'webhooks:manage');
    return response;
  }
  const { webhookId } = validation.data;

  const queued = await sendTestWebhookEvent({
    orgId: auth.context.orgId,
    webhookId,
    actorId: getActorId(auth.context),
  });

  await logV1Access(auth.context, 202, 'webhooks:manage');
  return jsonWithContext(auth.context, createEnvelope(queued), { status: 202 });
}
