import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const DEFAULT_TARGET_FRAMEWORKS = ['nist-csf', 'cis-controls']

export type ControlMappingSummary = {
  controlId: string
  controlCode: string
  controlTitle: string
  mappings: Array<{ frameworkSlug: string; reference: string; strength: string }>
  coverageScore: number
  mappedFrameworks: string[]
}

export async function getControlMappingSummary(
  frameworkSlug: string,
  targetFrameworks: string[] = DEFAULT_TARGET_FRAMEWORKS,
): Promise<ControlMappingSummary[]> {
  const admin = createSupabaseAdminClient()
  const { data: framework } = await admin
    .from('frameworks')
    .select('id')
    .eq('slug', frameworkSlug)
    .maybeSingle()

  if (!framework?.id) return []

  const { data: controls } = await admin
    .from('framework_controls')
    .select('id, control_code, title')
    .eq('framework_id', framework.id)

  if (!controls?.length) return []

  const controlIds = controls.map((control: any) => control.id)
  const { data: mappings } = await admin
    .from('control_mappings')
    .select('internal_control_id, framework_slug, external_control_reference, mapping_strength')
    .in('internal_control_id', controlIds)

  const mappingsByControl = new Map<string, ControlMappingSummary>()
  controls.forEach((control: any) => {
    mappingsByControl.set(control.id, {
      controlId: control.id,
      controlCode: control.control_code,
      controlTitle: control.title,
      mappings: [],
      coverageScore: 0,
      mappedFrameworks: [],
    })
  })

  ;(mappings ?? []).forEach((mapping: any) => {
    const summary = mappingsByControl.get(mapping.internal_control_id)
    if (!summary) return
    summary.mappings.push({
      frameworkSlug: mapping.framework_slug,
      reference: mapping.external_control_reference,
      strength: mapping.mapping_strength ?? 'secondary',
    })
  })

  return Array.from(mappingsByControl.values()).map((summary) => {
    const mappedFrameworks = Array.from(
      new Set(summary.mappings.map((mapping) => mapping.frameworkSlug)),
    )
    const targetCount = targetFrameworks.length || 1
    const coveredCount = mappedFrameworks.filter((slug) => targetFrameworks.includes(slug)).length
    const coverageScore = Math.round((coveredCount / targetCount) * 100)

    return {
      ...summary,
      mappedFrameworks,
      coverageScore,
    }
  })
}
