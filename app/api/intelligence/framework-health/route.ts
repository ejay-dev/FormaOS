import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  getCachedFrameworkIntelligence,
  setCachedFrameworkIntelligence,
  checkRateLimit,
  getRateLimitStatus,
} from '@/lib/cache/intelligence-cache'
import { calculateFrameworkReadiness } from '@/lib/audit/readiness-calculator'
import { detectComplianceGaps } from '@/lib/intelligence/gap-detector'
import { buildComplianceRecommendations } from '@/lib/intelligence/recommendations'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const orgId = membership.organization_id as string

  try {
    const rateLimitOk = await checkRateLimit(orgId)
    if (!rateLimitOk) {
      const status = await getRateLimitStatus(orgId)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((status.resetAt - Date.now()) / 1000),
        },
        { status: 429 },
      )
    }
  } catch {
    // ignore rate limit failures
  }

  const cached = getCachedFrameworkIntelligence(orgId)
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } })
  }

  const [readiness, gaps, recommendations] = await Promise.all([
    calculateFrameworkReadiness(orgId),
    detectComplianceGaps(orgId),
    buildComplianceRecommendations(orgId),
  ])

  const { data: snapshots } = await supabase
    .from('org_control_evaluations')
    .select('compliance_score, last_evaluated_at')
    .eq('organization_id', orgId)
    .eq('control_type', 'framework_snapshot')
    .order('last_evaluated_at', { ascending: false })
    .limit(8)

  const snapshotScores = (snapshots ?? []).map((row: any) => Number(row.compliance_score ?? 0))
  const latestAverage = snapshotScores.slice(0, 2).length
    ? Math.round(
        snapshotScores
          .slice(0, 2)
          .reduce((sum: number, score: number) => sum + score, 0) /
          snapshotScores.slice(0, 2).length,
      )
    : null
  const previousAverage = snapshotScores.slice(2, 4).length
    ? Math.round(
        snapshotScores
          .slice(2, 4)
          .reduce((sum: number, score: number) => sum + score, 0) /
          snapshotScores.slice(2, 4).length,
      )
    : null
  const readinessTrend =
    latestAverage !== null && previousAverage !== null ? latestAverage - previousAverage : null

  const { data: controlEvals } = await supabase
    .from('org_control_evaluations')
    .select('status, details')
    .eq('organization_id', orgId)
    .eq('control_type', 'framework_control')

  const heatmap: Record<string, Record<string, number>> = {}
  ;(controlEvals ?? []).forEach((row: any) => {
    const risk = (row.details?.risk_level ?? 'medium').toString().toLowerCase()
    const status = (row.status ?? 'unknown').toString().toLowerCase()
    if (!heatmap[risk]) heatmap[risk] = {}
    heatmap[risk][status] = (heatmap[risk][status] ?? 0) + 1
  })

  const combinedScore = readiness.length
    ? Math.round(
        readiness.reduce((sum, fw) => sum + fw.readinessScore * Math.max(1, fw.totalControls), 0) /
          readiness.reduce((sum, fw) => sum + Math.max(1, fw.totalControls), 0),
      )
    : 0

  const responseData = {
    combinedScore,
    readinessTrend,
    frameworks: readiness,
    gaps,
    recommendations,
    riskHeatmap: heatmap,
  }

  setCachedFrameworkIntelligence(orgId, responseData)

  return NextResponse.json(responseData, { headers: { 'X-Cache': 'MISS' } })
}
