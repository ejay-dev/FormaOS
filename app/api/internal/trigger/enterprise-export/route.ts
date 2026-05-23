import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalTriggerRequest, jsonError } from '../_auth';
import { processEnterpriseExportJob } from '@/lib/export/enterprise-export';
import { captureRouteError } from '@/lib/observability/with-route-observability';

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

  try {
    const result = await processEnterpriseExportJob(jobId);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    captureRouteError('internal.enterprise-export', error, {
      method: 'POST',
      url: request.url,
      jobId,
    });
    return jsonError(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}
