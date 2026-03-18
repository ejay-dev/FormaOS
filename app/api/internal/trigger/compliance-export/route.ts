import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalTriggerRequest, jsonError } from '../_auth';
import { processExportJob } from '@/lib/compliance/evidence-pack-export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = verifyInternalTriggerRequest(request);
  if (!auth.ok) {
    return jsonError(auth.error, auth.status);
  }

  const body = (await request.json().catch(() => null)) as
    | { jobId?: unknown }
    | null;
  const jobId = typeof body?.jobId === 'string' ? body.jobId.trim() : '';

  if (!jobId) {
    return jsonError('jobId is required', 400);
  }

  const result = await processExportJob(jobId, {
    workerId: 'trigger.dev',
    maxAttempts: 3,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
