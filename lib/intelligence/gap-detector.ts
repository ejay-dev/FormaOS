import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type GapDetectionResult = {
  missingEvidence: Array<{ controlKey: string; title?: string; required: number; approved: number }>
  unmappedControls: Array<{ controlId: string; controlCode: string; frameworkSlug: string }>
  weakAutomationCoverage: Array<{ controlKey: string; title?: string }>
}

const REQUIRED_MAPPING_TARGETS = ['nist-csf', 'cis-controls']

export async function detectComplianceGaps(orgId: string): Promise<GapDetectionResult> {
  const admin = createSupabaseAdminClient()

  const { data: evaluations } = await admin
    .from('org_control_evaluations')
    .select('control_key, status, details')
    .eq('organization_id', orgId)
    .eq('control_type', 'framework_control')

  const controlIds: string[] = []
  const missingEvidence = (evaluations ?? [])
    .map((row: any) => {
      const controlKey = row.control_key as string
      const controlId = controlKey?.startsWith('control:') ? controlKey.split(':')[1] : null
      if (controlId) controlIds.push(controlId)
      const required = Number(row.details?.required_evidence_count ?? row.details?.requiredEvidenceCount ?? 0)
      const approved = Number(row.details?.approved_evidence_count ?? row.details?.approvedEvidenceCount ?? 0)
      if (required > 0 && approved < required) {
        return {
          controlKey,
          title: row.details?.title ?? row.details?.control_title ?? undefined,
          required,
          approved,
        }
      }
      return null
    })
    .filter(Boolean) as Array<{ controlKey: string; title?: string; required: number; approved: number }>

  const { data: taskLinks } = await admin
    .from('control_tasks')
    .select('control_id')
    .eq('organization_id', orgId)
    .in('control_id', controlIds)

  const taskControlIds = new Set((taskLinks ?? []).map((row: any) => row.control_id))
  const weakAutomationCoverage = (evaluations ?? [])
    .map((row: any) => {
      const controlKey = row.control_key as string
      const controlId = controlKey?.startsWith('control:') ? controlKey.split(':')[1] : null
      if (controlId && !taskControlIds.has(controlId)) {
        return {
          controlKey,
          title: row.details?.title ?? row.details?.control_title ?? undefined,
        }
      }
      return null
    })
    .filter(Boolean) as Array<{ controlKey: string; title?: string }>

  const { data: soc2Framework } = await admin
    .from('frameworks')
    .select('id')
    .eq('slug', 'soc2')
    .maybeSingle()

  let unmappedControls: GapDetectionResult['unmappedControls'] = []
  if (soc2Framework?.id) {
    const { data: controls } = await admin
      .from('framework_controls')
      .select('id, control_code')
      .eq('framework_id', soc2Framework.id)

    const soc2ControlIds = controls?.map((control: any) => control.id) ?? []
    const { data: mappings } = soc2ControlIds.length
      ? await admin
          .from('control_mappings')
          .select('internal_control_id, framework_slug')
          .in('internal_control_id', soc2ControlIds)
      : { data: [] }

    const mappingByControl = new Map<string, Set<string>>()
    ;(mappings ?? []).forEach((mapping: any) => {
      if (!mappingByControl.has(mapping.internal_control_id)) {
        mappingByControl.set(mapping.internal_control_id, new Set())
      }
      mappingByControl.get(mapping.internal_control_id)!.add(mapping.framework_slug)
    })

    unmappedControls = (controls ?? [])
      .filter((control: any) => {
        const mapped = mappingByControl.get(control.id)
        if (!mapped) return true
        return REQUIRED_MAPPING_TARGETS.some((target) => !mapped.has(target))
      })
      .map((control: any) => ({
        controlId: control.id,
        controlCode: control.control_code,
        frameworkSlug: 'soc2',
      }))
  }

  return {
    missingEvidence,
    unmappedControls,
    weakAutomationCoverage,
  }
}
