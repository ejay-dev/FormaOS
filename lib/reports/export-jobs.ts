import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { buildReport } from '@/lib/audit-reports/report-builder'
import { generateReportPdf } from '@/lib/audit-reports/pdf-generator'
import type { ReportType } from '@/lib/audit-reports/types'
import { getQueueClient } from '@/lib/queue'

type ReportFormat = 'pdf' | 'json'

type ProcessOptions = {
  workerId?: string
  maxAttempts?: number
  preclaimed?: boolean
}

const DEFAULT_MAX_ATTEMPTS = 3

function getRetryDelayMs(attempt: number) {
  const base = 60_000
  const max = 15 * 60_000
  const delay = Math.min(base * Math.pow(2, Math.max(attempt - 1, 0)), max)
  return delay + Math.floor(Math.random() * 5_000)
}

export async function createReportExportJob(params: {
  organizationId: string
  requestedBy: string
  reportType: ReportType
  format?: ReportFormat
}) {
  const admin = createSupabaseAdminClient()
  const format = params.format ?? 'pdf'

  const { data: job, error } = await admin
    .from('report_export_jobs')
    .insert({
      organization_id: params.organizationId,
      requested_by: params.requestedBy,
      report_type: params.reportType,
      format,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !job?.id) {
    return { ok: false, error: error?.message ?? 'Failed to create report job' }
  }

  // If the Redis-backed queue is configured, enqueue for background processing.
  // This reduces reliance on scheduled DB claim cron and avoids long-running inline exports.
  try {
    const queue = getQueueClient()
    await queue.enqueue(
      'report-export',
      {
        jobId: job.id,
        organizationId: params.organizationId,
        reportType: params.reportType,
        requestedBy: params.requestedBy,
      },
      { organizationId: params.organizationId },
    )
  } catch {
    // No-op: cron/inline processing can still handle the job.
  }

  return { ok: true, jobId: job.id }
}

export async function processReportExportJob(
  jobId: string,
  options: ProcessOptions = {},
): Promise<{ ok: boolean; fileUrl?: string; error?: string }> {
  const admin = createSupabaseAdminClient()
  const workerId = options.workerId ?? 'inline'
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const preclaimed = options.preclaimed ?? false

  try {
    const { data: job } = await admin
      .from('report_export_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (!job) {
      throw new Error('Report job not found')
    }

    // Idempotency: if job already completed, do not regenerate.
    if (job.status === 'completed' && job.file_url) {
      return { ok: true, fileUrl: job.file_url }
    }

    const attempt = preclaimed ? job.attempt_count ?? 0 : (job.attempt_count ?? 0) + 1

    if (!preclaimed) {
      await admin
        .from('report_export_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          progress: 0,
          locked_at: new Date().toISOString(),
          locked_by: workerId,
          attempt_count: attempt,
          last_error: null,
        })
        .eq('id', jobId)
    }

    const reportType = job.report_type as ReportType
    const format = (job.format as ReportFormat) || 'pdf'

    const report = await buildReport(job.organization_id, reportType)

    const bucket =
      (process.env.REPORT_EXPORTS_BUCKET ?? '').trim() || 'report-exports'
    if (!('storage' in admin) || !admin.storage) {
      throw new Error('Supabase storage client unavailable')
    }

    const datePart = new Date().toISOString().slice(0, 10)
    const storagePath = `${job.organization_id}/${reportType}/${datePart}/${jobId}.${format}`

    let fileBuffer: Buffer
    let contentType = 'application/pdf'

    if (format === 'json') {
      fileBuffer = Buffer.from(JSON.stringify(report, null, 2), 'utf-8')
      contentType = 'application/json'
    } else {
      const pdfBlob = generateReportPdf(report, reportType)
      const pdfBuffer = await pdfBlob.arrayBuffer()
      fileBuffer = Buffer.from(pdfBuffer)
    }

    const upload = await admin.storage.from(bucket).upload(storagePath, fileBuffer, {
      contentType,
      upsert: false,
    })

    if (upload.error) {
      throw new Error(`Storage upload failed: ${upload.error.message}`)
    }

    const signed = await admin.storage.from(bucket).createSignedUrl(storagePath, 60 * 60)

    if (signed.error || !signed.data?.signedUrl) {
      throw new Error(`Signed URL failed: ${signed.error?.message ?? 'Unknown error'}`)
    }

    await admin
      .from('report_export_jobs')
      .update({
        status: 'completed',
        progress: 100,
        file_url: signed.data.signedUrl,
        file_size: fileBuffer.length,
        metadata: {
          storagePath,
          bucket,
          reportType,
          format,
          signedUrlExpiresIn: 3600,
        },
        completed_at: new Date().toISOString(),
        locked_at: null,
        locked_by: null,
        last_error: null,
      })
      .eq('id', jobId)

    return { ok: true, fileUrl: signed.data.signedUrl }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Report export failed'

    const { data: job } = await admin
      .from('report_export_jobs')
      .select('attempt_count')
      .eq('id', jobId)
      .maybeSingle()

    const attempt = job?.attempt_count ?? 0
    const shouldRetry = attempt > 0 && attempt < maxAttempts
    const nextRunAt = shouldRetry
      ? new Date(Date.now() + getRetryDelayMs(attempt)).toISOString()
      : null

    await admin
      .from('report_export_jobs')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        error_message: message,
        last_error: message,
        next_run_at: nextRunAt,
        locked_at: null,
        locked_by: null,
      })
      .eq('id', jobId)

    return { ok: false, error: message }
  }
}
