import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/reports/exports/[jobId]/status');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership?.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try selecting the typed columns. If the migration hasn't applied yet
    // we fall back to the legacy projection without storage_path.
    let job: Record<string, unknown> | null = null;
    let typedColumnsAvailable = true;
    {
      const { data, error } = await supabase
        .from('report_export_jobs')
        .select(
          'id, status, progress, file_url, file_size, created_at, completed_at, error_message, storage_path, storage_bucket, metadata',
        )
        .eq('id', jobId)
        .eq('organization_id', membership.organization_id)
        .eq('requested_by', user.id)
        .maybeSingle();
      if (error && /storage_path|storage_bucket/.test(error.message)) {
        typedColumnsAvailable = false;
      } else if (error || !data) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      } else {
        job = data as Record<string, unknown>;
      }
    }

    if (!typedColumnsAvailable) {
      const { data, error } = await supabase
        .from('report_export_jobs')
        .select(
          'id, status, progress, file_url, file_size, created_at, completed_at, error_message, metadata',
        )
        .eq('id', jobId)
        .eq('organization_id', membership.organization_id)
        .eq('requested_by', user.id)
        .maybeSingle();
      if (error || !data) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      job = data as Record<string, unknown>;
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Generate a first-party download URL so users see a polished app URL
    // instead of raw Supabase object storage links.
    let fileUrl = (job.file_url as string | null) ?? null;
    const storagePath =
      (job.storage_path as string | null) ??
      (typeof job.metadata === 'object' && job.metadata !== null
        ? (((job.metadata as Record<string, unknown>).storagePath as
            | string
            | undefined) ?? null)
        : null);

    if (job.status === 'completed' && (storagePath || fileUrl)) {
      fileUrl = `/api/reports/exports/${encodeURIComponent(String(job.id))}/download`;
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        fileUrl,
        fileSize: job.file_size,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        errorMessage: job.error_message,
      },
    });
  } catch (error) {
    log.error({ err: error }, '[reports/exports/status] Error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
