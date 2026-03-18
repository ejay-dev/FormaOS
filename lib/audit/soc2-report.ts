import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { calculateFrameworkReadiness } from './readiness-calculator'
import { getControlMappingSummary } from '@/lib/frameworks/mappings'

export type Soc2ReportPayload = {
  generatedAt: string
  frameworkCode: string
  readinessScore: number
  controlSummary: {
    total: number
    satisfied: number
    missing: number
    partial: number
  }
  evidenceSummary: {
    total: number
    verified: number
    pending: number
    rejected: number
  }
  taskSummary: {
    total: number
    completed: number
    overdue: number
  }
  mappingCoverage: {
    averageCoverage: number
    controls: Array<{
      controlCode: string
      controlTitle: string
      mappedFrameworks: string[]
      coverageScore: number
    }>
  }
  gaps: {
    missingControls: number
    partialControls: number
  }
}

export async function buildSoc2Report(orgId: string): Promise<Soc2ReportPayload> {
  const admin = createSupabaseAdminClient()
  const readiness = await calculateFrameworkReadiness(orgId)
  const soc2Readiness = readiness.find((item) => item.frameworkCode === 'SOC2')

  const [evidenceRows, taskRows, mappings] = await Promise.all([
    admin.from('org_evidence').select('verification_status').eq('organization_id', orgId),
    admin.from('org_tasks').select('status, due_date').eq('organization_id', orgId),
    getControlMappingSummary('soc2'),
  ])

  const evidence = evidenceRows.data ?? []
  const tasks = taskRows.data ?? []

  const evidenceSummary = {
    total: evidence.length,
    verified: evidence.filter((row: any) => row.verification_status === 'verified').length,
    pending: evidence.filter((row: any) => !row.verification_status).length,
    rejected: evidence.filter((row: any) => row.verification_status === 'rejected').length,
  }

  const now = new Date()
  const taskSummary = {
    total: tasks.length,
    completed: tasks.filter((row: any) => row.status === 'completed').length,
    overdue: tasks.filter((row: any) => row.status !== 'completed' && row.due_date && new Date(row.due_date) < now)
      .length,
  }

  const coverageScores = mappings.map((mapping) => mapping.coverageScore)
  const averageCoverage = coverageScores.length
    ? Math.round(coverageScores.reduce((sum, score) => sum + score, 0) / coverageScores.length)
    : 0

  return {
    generatedAt: new Date().toISOString(),
    frameworkCode: 'SOC2',
    readinessScore: soc2Readiness?.readinessScore ?? 0,
    controlSummary: {
      total: soc2Readiness?.totalControls ?? 0,
      satisfied: soc2Readiness?.satisfiedControls ?? 0,
      missing: soc2Readiness?.missingControls ?? 0,
      partial: soc2Readiness?.partialControls ?? 0,
    },
    evidenceSummary,
    taskSummary,
    mappingCoverage: {
      averageCoverage,
      controls: mappings.map((mapping) => ({
        controlCode: mapping.controlCode,
        controlTitle: mapping.controlTitle,
        mappedFrameworks: mapping.mappedFrameworks,
        coverageScore: mapping.coverageScore,
      })),
    },
    gaps: {
      missingControls: soc2Readiness?.missingControls ?? 0,
      partialControls: soc2Readiness?.partialControls ?? 0,
    },
  }
}
