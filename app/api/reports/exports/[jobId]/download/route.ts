import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/reports/exports/[jobId]/download');

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFilename(args: {
  orgName: string | null;
  reportType: string | null;
  format: string | null;
  completedAt: string | null;
}) {
  const org = sanitizeSegment(args.orgName ?? 'FormaOS') || 'FormaOS';
  const report =
    sanitizeSegment((args.reportType ?? 'compliance').toUpperCase()) ||
    'COMPLIANCE';
  const date = (args.completedAt ?? new Date().toISOString()).slice(0, 10);
  const extension =
    (args.format ?? 'pdf').toLowerCase() === 'json' ? 'json' : 'pdf';
  return `${org}-${report}-Report-${date}.${extension}`;
}

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

    let job: Record<string, unknown> | null = null;
    let typedColumnsAvailable = true;

    {
      const { data, error } = await supabase
        .from('report_export_jobs')
        .select(
          'id, organization_id, requested_by, status, report_type, format, completed_at, file_url, storage_path, storage_bucket, metadata',
        )
        .eq('id', jobId)
        .eq('organization_id', membership.organization_id)
        .eq('requested_by', user.id)
        .maybeSingle();

      if (error && /storage_path|storage_bucket/.test(error.message)) {
        typedColumnsAvailable = false;
      } else if (error || !data) {
        return NextResponse.json(
          { error: 'Export job not found' },
          { status: 404 },
        );
      } else {
        job = data as Record<string, unknown>;
      }
    }

    if (!typedColumnsAvailable) {
      const { data, error } = await supabase
        .from('report_export_jobs')
        .select(
          'id, organization_id, requested_by, status, report_type, format, completed_at, file_url, metadata',
        )
        .eq('id', jobId)
        .eq('organization_id', membership.organization_id)
        .eq('requested_by', user.id)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Export job not found' },
          { status: 404 },
        );
      }
      job = data as Record<string, unknown>;
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Export job not found' },
        { status: 404 },
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Export not ready yet' },
        { status: 409 },
      );
    }

    const storagePath =
      (job.storage_path as string | null) ??
      (typeof job.metadata === 'object' && job.metadata !== null
        ? (((job.metadata as Record<string, unknown>).storagePath as
            | string
            | undefined) ?? null)
        : null);

    const storageBucket =
      (job.storage_bucket as string | null) ??
      (typeof job.metadata === 'object' && job.metadata !== null
        ? (((job.metadata as Record<string, unknown>).bucket as
            | string
            | undefined) ?? null)
        : null) ??
      ((process.env.REPORT_EXPORTS_BUCKET ?? '').trim() || 'report-exports');

    const admin = createSupabaseAdminClient();

    const { data: orgRow } = await admin
      .from('organizations')
      .select('name')
      .eq('id', String(job.organization_id))
      .maybeSingle();

    const filename = buildFilename({
      orgName: (orgRow?.name as string | null) ?? null,
      reportType: (job.report_type as string | null) ?? null,
      format: (job.format as string | null) ?? null,
      completedAt: (job.completed_at as string | null) ?? null,
    });

    let fileBuffer: ArrayBuffer | null = null;
    let contentType =
      (job.format as string | null) === 'json'
        ? 'application/json'
        : 'application/pdf';

    if (storagePath) {
      const downloaded = await admin.storage
        .from(storageBucket)
        .download(storagePath);
      if (!downloaded.error && downloaded.data) {
        fileBuffer = await downloaded.data.arrayBuffer();
        if (downloaded.data.type) {
          contentType = downloaded.data.type;
        }
      }
    }

    if (!fileBuffer) {
      const fallbackUrl = job.file_url as string | null;
      if (!fallbackUrl) {
        return NextResponse.json(
          { error: 'Export file unavailable' },
          { status: 404 },
        );
      }

      const fetched = await fetch(fallbackUrl);
      if (!fetched.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch export file' },
          { status: 502 },
        );
      }

      fileBuffer = await fetched.arrayBuffer();
      const fetchedType = fetched.headers.get('content-type');
      if (fetchedType) {
        contentType = fetchedType;
      }
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    log.error({ err: error }, 'report export download failed');
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
