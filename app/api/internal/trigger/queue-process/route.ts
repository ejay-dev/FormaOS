import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalTriggerRequest, jsonError } from '../_auth';
import { processQueueJobs } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = verifyInternalTriggerRequest(request);
  if (!auth.ok) {
    return jsonError(auth.error, auth.status);
  }

  const body = (await request.json().catch(() => null)) as
    | { batchSize?: unknown }
    | null;
  const rawBatchSize =
    typeof body?.batchSize === 'number' ? body.batchSize : undefined;
  const batchSize =
    typeof rawBatchSize === 'number' && Number.isFinite(rawBatchSize)
      ? Math.min(Math.max(rawBatchSize, 1), 50)
      : undefined;

  const result = await processQueueJobs(batchSize);

  return NextResponse.json({ ok: true, ...result });
}
