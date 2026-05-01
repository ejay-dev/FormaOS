import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/reports/exports/[jobId]/status');

// Fresh signed URLs are issued for FIVE MINUTES on every status check.
// Callers are expected to download immediately after calling this endpoint;
// re-polling status returns a fresh URL each time. This eliminates the
// rotted-URL problem (audit P2 #17) where a 1-hour TTL stored at job
// completion left links broken once the user came back later.
const SIGNED_URL_TTL_SECONDS = 5 * 60

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership?.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Try selecting the typed columns. If the migration hasn't applied yet
    // we fall back to the legacy projection without storage_path.
    let job: Record<string, unknown> | null = null
    let typedColumnsAvailable = true
    {
      const { data, error } = await supabase
        .from('report_export_jobs')
        .select(
          'id, status, progress, file_url, file_size, created_at, completed_at, error_message, storage_path, storage_bucket, metadata',
        )
        .eq('id', jobId)
        .eq('organization_id', membership.organization_id)
        .eq('requested_by', user.id)
        .maybeSingle()
      if (error && /storage_path|storage_bucket/.test(error.message)) {
        typedColumnsAvailable = false
      } else if (error || !data) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      } else {
        job = data as Record<string, unknown>
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
        .maybeSingle()
      if (error || !data) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      job = data as Record<string, unknown>
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Regenerate a fresh signed URL whenever we have a storage path. Prefer
    // the typed columns; fall back to metadata.storagePath / metadata.bucket
    // for rows written before the typed columns landed.
    let fileUrl = (job.file_url as string | null) ?? null
    const storagePath =
      (job.storage_path as string | null) ??
      (typeof job.metadata === 'object' && job.metadata !== null
        ? ((job.metadata as Record<string, unknown>).storagePath as
            | string
            | undefined) ?? null
        : null)
    const storageBucket =
      (job.storage_bucket as string | null) ??
      (typeof job.metadata === 'object' && job.metadata !== null
        ? ((job.metadata as Record<string, unknown>).bucket as
            | string
            | undefined) ?? null
        : null) ??
      ((process.env.REPORT_EXPORTS_BUCKET ?? '').trim() || 'report-exports')

    if (job.status === 'completed' && storagePath) {
      try {
        const admin = createSupabaseAdminClient()
        if ('storage' in admin && admin.storage) {
          const fresh = await admin.storage
            .from(storageBucket)
            .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
          if (fresh.data?.signedUrl) {
            fileUrl = fresh.data.signedUrl
          } else if (fresh.error) {
            log.warn(
              { err: fresh.error.message, jobId, storagePath, storageBucket },
              'failed to regenerate signed url; returning stored fileUrl',
            )
          }
        }
      } catch (regenErr) {
        log.warn(
          { err: regenErr, jobId },
          'signed url regeneration threw; returning stored fileUrl',
        )
      }
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
    })
  } catch (error) {
    log.error({ err: error }, "[reports/exports/status] Error:")
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
