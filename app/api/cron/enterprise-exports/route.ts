import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getRedisConfig } from '@/lib/redis/client'
import { processEnterpriseExportJob } from '@/lib/export/enterprise-export'

const DEFAULT_LIMIT = 2

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function verifyCronSecret(request: Request): { ok: boolean; error?: string } {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return { ok: false, error: 'CRON_SECRET not configured' }
  }

  const tokenBuffer = Buffer.from(token, 'utf8')
  const secretBuffer = Buffer.from(cronSecret, 'utf8')
  const ok =
    tokenBuffer.length === secretBuffer.length &&
    timingSafeEqual(tokenBuffer, secretBuffer)

  if (!ok) return { ok: false, error: 'Unauthorized' }
  return { ok: true }
}

async function handleEnterpriseExportsCron(request: Request) {
  const auth = verifyCronSecret(request)
  if (!auth.ok) {
    const status = auth.error === 'CRON_SECRET not configured' ? 500 : 401
    return NextResponse.json({ ok: false, error: auth.error }, { status })
  }

  // If the Redis queue is configured, prefer the queue worker to avoid double-processing.
  const redisCfg = getRedisConfig()
  if (redisCfg.url && redisCfg.token) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'redis_queue_enabled' })
  }

  const url = new URL(request.url)
  const limit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT)
  const batch = Number.isFinite(limit) ? Math.max(0, Math.min(limit, 5)) : DEFAULT_LIMIT

  const admin = createSupabaseAdminClient()

  const { data: jobs, error } = await admin
    .from('enterprise_export_jobs')
    .select('id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(batch)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  let processed = 0
  let failed = 0

  for (const j of jobs ?? []) {
    processed += 1
    const res = await processEnterpriseExportJob(j.id)
    if (!res.ok) failed += 1
  }

  return NextResponse.json({ ok: true, claimed: jobs?.length ?? 0, processed, failed })
}

export async function GET(request: Request) {
  return handleEnterpriseExportsCron(request)
}

export async function POST(request: Request) {
  return handleEnterpriseExportsCron(request)
}
