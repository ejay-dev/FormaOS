import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { processReportExportJob } from '@/lib/reports/export-jobs'
import { timingSafeEqual } from 'crypto'
import { getRedisConfig } from '@/lib/redis/client'

const DEFAULT_LIMIT = 3

async function handleReportExportsCron(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const token = authHeader?.replace('Bearer ', '') ?? ''
  const tokenBuffer = Buffer.from(token, 'utf8')
  const secretBuffer = Buffer.from(cronSecret, 'utf8')
  const ok =
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer)

  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // If the Redis queue is configured, prefer the queue worker to avoid double-processing.
  const redisCfg = getRedisConfig()
  if (redisCfg.url && redisCfg.token) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'redis_queue_enabled' })
  }

  const url = new URL(request.url)
  const limit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT)
  const workerId = `cron:${Date.now()}`

  const admin = createSupabaseAdminClient()
  const { data: jobs, error } = await admin.rpc('claim_report_export_jobs', {
    p_limit: Number.isFinite(limit) ? Math.max(0, Math.min(limit, 10)) : DEFAULT_LIMIT,
    p_worker_id: workerId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let processed = 0
  let failed = 0

  for (const job of jobs ?? []) {
    processed += 1
    const result = await processReportExportJob(job.id, {
      workerId,
      maxAttempts: 3,
      preclaimed: true,
    })
    if (!result.ok) failed += 1
  }

  return NextResponse.json({
    ok: true,
    claimed: jobs?.length ?? 0,
    processed,
    failed,
  })
}

export async function GET(request: Request) {
  return handleReportExportsCron(request)
}

export async function POST(request: Request) {
  return handleReportExportsCron(request)
}
