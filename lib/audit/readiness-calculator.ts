import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getFrameworkCodeForSlug } from '@/lib/frameworks/framework-installer'

export type FrameworkReadiness = {
  frameworkId: string
  frameworkCode: string
  frameworkTitle: string
  readinessScore: number
  totalControls: number
  satisfiedControls: number
  missingControls: number
  partialControls: number
  evaluatedAt: string | null
}

export async function calculateFrameworkReadiness(orgId: string): Promise<FrameworkReadiness[]> {
  const admin = createSupabaseAdminClient()

  let { data: frameworks } = await admin
    .from('compliance_frameworks')
    .select('id, code, title')

  if (!frameworks?.length) return []

  try {
    const { data: enabled } = await admin
      .from('org_frameworks')
      .select('framework_slug')
      .eq('org_id', orgId)

    const enabledSlugs = (enabled ?? []).map((row: any) => row.framework_slug)
    if (enabledSlugs.length) {
      const enabledCodes = new Set(
        enabledSlugs.map((slug: string) => getFrameworkCodeForSlug(slug)),
      )
      frameworks = frameworks.filter((fw: any) => enabledCodes.has(fw.code))
    }
  } catch {
    // ignore and fallback to full list
  }

  const { data: snapshots } = await admin
    .from('org_control_evaluations')
    .select(
      'framework_id, compliance_score, total_controls, satisfied_controls, missing_controls, partial_control_codes, last_evaluated_at',
    )
    .eq('organization_id', orgId)
    .eq('control_type', 'framework_snapshot')
    .order('last_evaluated_at', { ascending: false })

  const latestByFramework = new Map<string, any>()
  ;(snapshots ?? []).forEach((row: any) => {
    if (!row.framework_id) return
    if (!latestByFramework.has(row.framework_id)) {
      latestByFramework.set(row.framework_id, row)
    }
  })

  return frameworks.map((framework: any) => {
    const snapshot = latestByFramework.get(framework.id)
    const totalControls = Number(snapshot?.total_controls ?? 0)
    const satisfiedControls = Number(snapshot?.satisfied_controls ?? 0)
    const missingControls = Number(snapshot?.missing_controls ?? 0)
    const partialControls = Array.isArray(snapshot?.partial_control_codes)
      ? snapshot.partial_control_codes.length
      : 0

    const readinessScore = Number(snapshot?.compliance_score ?? 0)

    return {
      frameworkId: framework.id as string,
      frameworkCode: framework.code ?? 'UNKNOWN',
      frameworkTitle: framework.title ?? framework.code,
      readinessScore,
      totalControls,
      satisfiedControls,
      missingControls,
      partialControls,
      evaluatedAt: snapshot?.last_evaluated_at ?? null,
    }
  })
}
