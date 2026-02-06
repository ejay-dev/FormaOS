/**
 * Compliance Score Snapshot Service
 * Captures daily snapshots for historical tracking
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { calculateFrameworkReadiness } from '@/lib/audit/readiness-calculator'

export type ComplianceSnapshot = {
  id: string
  organization_id: string
  framework_slug: string
  snapshot_date: string
  compliance_score: number
  total_controls: number
  satisfied_controls: number
  partial_controls: number
  missing_controls: number
  evidence_count: number
  task_completion_rate: number
  captured_at: string
}

/**
 * Capture daily compliance score snapshot for all enabled frameworks
 */
export async function captureComplianceSnapshot(
  orgId: string,
  frameworkSlug?: string
): Promise<{ ok: boolean; snapshots?: number; error?: string }> {
  try {
    const admin = createSupabaseAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Get framework readiness scores
    const readiness = await calculateFrameworkReadiness(orgId)
    const frameworks = frameworkSlug
      ? readiness.filter((r) => r.frameworkCode.toLowerCase() === frameworkSlug)
      : readiness

    if (frameworks.length === 0) {
      return { ok: false, error: 'No frameworks enabled for this organization' }
    }

    // Get evidence and task counts
    const { data: evidenceCounts } = await admin
      .from('org_evidence')
      .select('id')
      .eq('organization_id', orgId)

    const { data: tasks } = await admin
      .from('org_tasks')
      .select('status')
      .eq('organization_id', orgId)

    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const snapshots = frameworks.map((fw) => ({
      organization_id: orgId,
      framework_slug: fw.frameworkCode.toLowerCase().replace('_', '-'),
      snapshot_date: today,
      compliance_score: fw.readinessScore,
      total_controls: fw.totalControls,
      satisfied_controls: fw.satisfiedControls,
      partial_controls: fw.partialControls,
      missing_controls: fw.missingControls,
      evidence_count: evidenceCounts?.length || 0,
      task_completion_rate: Math.round(taskCompletionRate * 100) / 100,
      metadata: {
        framework_title: fw.frameworkTitle,
        evaluated_at: fw.evaluatedAt,
      },
    }))

    const { error } = await admin
      .from('compliance_score_snapshots')
      .upsert(snapshots, { onConflict: 'organization_id,framework_slug,snapshot_date' })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, snapshots: snapshots.length }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to capture snapshot',
    }
  }
}

/**
 * Get historical snapshots for a framework
 */
export async function getSnapshotHistory(
  orgId: string,
  frameworkSlug: string,
  days: number = 30
): Promise<ComplianceSnapshot[]> {
  const admin = createSupabaseAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await admin
    .from('compliance_score_snapshots')
    .select('*')
    .eq('organization_id', orgId)
    .eq('framework_slug', frameworkSlug)
    .gte('snapshot_date', since.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true })

  if (error) {
    console.error('[SnapshotService] Failed to load history:', error)
    return []
  }

  return (data || []) as ComplianceSnapshot[]
}

/**
 * Detect score regression (>10% drop)
 */
export async function detectScoreRegression(
  orgId: string,
  frameworkSlug: string
): Promise<{
  hasRegression: boolean
  currentScore: number
  previousScore: number
  drop: number
} | null> {
  const admin = createSupabaseAdminClient()

  const { data: recent } = await admin
    .from('compliance_score_snapshots')
    .select('compliance_score, snapshot_date')
    .eq('organization_id', orgId)
    .eq('framework_slug', frameworkSlug)
    .order('snapshot_date', { ascending: false })
    .limit(2)

  if (!recent || recent.length < 2) {
    return null
  }

  const currentScore = recent[0].compliance_score
  const previousScore = recent[1].compliance_score
  const drop = previousScore - currentScore
  const dropPercent = (drop / previousScore) * 100

  return {
    hasRegression: dropPercent > 10,
    currentScore,
    previousScore,
    drop: Math.round(dropPercent),
  }
}

/**
 * Calculate improvement since last audit
 */
export async function getImprovementSinceLastAudit(
  orgId: string,
  frameworkSlug: string,
  lastAuditDate: string
): Promise<{ improvement: number; current: number; baseline: number }> {
  const admin = createSupabaseAdminClient()

  // Get score closest to audit date
  const { data: baseline } = await admin
    .from('compliance_score_snapshots')
    .select('compliance_score')
    .eq('organization_id', orgId)
    .eq('framework_slug', frameworkSlug)
    .lte('snapshot_date', lastAuditDate)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get most recent score
  const { data: current } = await admin
    .from('compliance_score_snapshots')
    .select('compliance_score')
    .eq('organization_id', orgId)
    .eq('framework_slug', frameworkSlug)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const baselineScore = baseline?.compliance_score || 0
  const currentScore = current?.compliance_score || 0

  return {
    improvement: currentScore - baselineScore,
    current: currentScore,
    baseline: baselineScore,
  }
}
