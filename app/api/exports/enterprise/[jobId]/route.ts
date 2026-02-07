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
      userId: payload.userId,
      orgId: payload.orgId,
    });

    // In production, this would stream from S3/storage
    // For now, return job info with download instructions
    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      fileSize: job.fileSize,
      message: 'Export ready for download',
      // In production, return a pre-signed S3 URL here
    });
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

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
