/**
 * =========================================================
 * Enterprise Export Download API
 * =========================================================
 * Secure download endpoint with signed token validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyExportToken } from '@/lib/security/export-tokens';
import { getExportJobStatus } from '@/lib/export/enterprise-export';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { exportLogger } from '@/lib/observability/structured-logger';
import { timingSafeEqual } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  try {
    // Get token from query params
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing download token' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyExportToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired download token' },
        { status: 401 }
      );
    }

    // Verify job ID matches token
    if (payload.jobId !== jobId) {
      return NextResponse.json(
        { error: 'Token does not match requested export' },
        { status: 403 }
      );
    }

    // Verify the caller is an owner/admin of this org (enterprise buyers expect org-scoped sharing).
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', payload.orgId)
      .maybeSingle();

    if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get job status
    const job = await getExportJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Export job not found' },
        { status: 404 }
      );
    }

    // Check job is completed
    if (job.status !== 'completed') {
      return NextResponse.json({
        error: 'Export not ready',
        status: job.status,
        progress: job.progress,
      }, { status: 202 });
    }

    // Check expiry
    if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Export has expired' },
        { status: 410 }
      );
    }

    // Log download
    exportLogger.info('export_downloaded', {
      jobId,
      orgId: payload.orgId,
    });

    // Prefer legacy file_url if present (production schema may not include storage_* columns yet).
    const admin = createSupabaseAdminClient();
    const { data: legacy, error: legacyError } = await admin
      .from('enterprise_export_jobs')
      .select('file_url')
      .eq('id', jobId)
      .maybeSingle();

    if (legacyError) {
      return NextResponse.json({ error: legacyError.message }, { status: 500 });
    }

    const fileUrl = (legacy as any)?.file_url as string | null | undefined;
    if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
      return NextResponse.redirect(fileUrl);
    }

    return NextResponse.json(
      { error: 'Export file URL unavailable' },
      { status: 500 },
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    exportLogger.error('export_download_failed', err, { jobId });

    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new enterprise export job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // This endpoint is for triggering export processing
  const { jobId } = await params;
  const admin = createSupabaseAdminClient();

  try {
    // Verify request is from internal system (cron or admin)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    const token = authHeader?.replace('Bearer ', '') ?? '';
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    const tokenBuffer = Buffer.from(token, 'utf8');
    const secretBuffer = Buffer.from(cronSecret, 'utf8');
    const ok =
      tokenBuffer.length === secretBuffer.length &&
      timingSafeEqual(tokenBuffer, secretBuffer);

    if (!ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Import and process
    const { processEnterpriseExportJob } = await import('@/lib/export/enterprise-export');
    const result = await processEnterpriseExportJob(jobId);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: result.downloadUrl,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    exportLogger.error('export_processing_failed', err, { jobId });

    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
