import { authenticateV1Request, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';
import { listWebhookDeliveries } from '@/lib/webhooks/delivery-queue';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['webhooks:manage'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { limit, offset, searchParams } = getPagination(request, 25, 100);
  const result = await listWebhookDeliveries({
    orgId: auth.context.orgId,
    limit,
    offset,
    event: searchParams.get('event'),
    status: searchParams.get('status'),
    webhookId: searchParams.get('webhook_id'),
  });

  await logV1Access(auth.context, 200, 'webhooks:manage');
  return jsonWithContext(
    auth.context,
    paginatedEnvelope(result.data, { offset, limit, total: result.total }),
  );
}
