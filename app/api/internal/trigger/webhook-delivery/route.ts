import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalTriggerRequest, jsonError } from '../_auth';
import { processWebhookDelivery } from '@/lib/webhooks/delivery-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = verifyInternalTriggerRequest(request);
  if (!auth.ok) {
    return jsonError(auth.error, auth.status);
  }

  const body = (await request.json().catch(() => null)) as
    | { deliveryId?: unknown }
    | null;
  const deliveryId =
    typeof body?.deliveryId === 'string' ? body.deliveryId.trim() : '';

  if (!deliveryId) {
    return jsonError('deliveryId is required', 400);
  }

  const result = await processWebhookDelivery(deliveryId);
  return NextResponse.json(result, { status: result.ok ? 200 : 202 });
}
