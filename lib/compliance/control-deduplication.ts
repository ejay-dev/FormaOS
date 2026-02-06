/**
 * Cross-Framework Control Deduplication Engine
 * Creates unified master controls and tracks framework mappings
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type MasterControl = {
  id: string
  control_code: string
  title: string
  description: string | null
  risk_level: string
  frameworks: Array<{
    slug: string
    name: string
    controlCode: string
  }>
}

/**
 * Build master control mappings from existing framework controls
 * Safe and idempotent - can be run multiple times
 */
export async function buildMasterControlMappings(): Promise<{
  ok: boolean
  created: number
  error?: string
}> {
  try {
    const admin = createSupabaseAdminClient()

    // Get all framework controls with their framework info
    const { data: controls } = await admin
      .from('framework_controls')
      .select(`
        id,
        control_code,
        title,
        summary_description,
        default_risk_level,
        framework_id,
        frameworks (slug, name)
      `)

    if (!controls) {
      return { ok: false, created: 0, error: 'No controls found' }
    }

    let created = 0

    // Group controls by normalized title to find duplicates
    const titleGroups = new Map<string, any[]>()
    controls.forEach((control) => {
      const normalizedTitle = control.title.toLowerCase().trim()
      if (!titleGroups.has(normalizedTitle)) {
        titleGroups.set(normalizedTitle, [])
      }
      titleGroups.get(normalizedTitle)!.push(control)
    })

    // Process each group
    for (const [title, groupControls] of titleGroups) {
      if (groupControls.length === 1) {
        // Single control - create master control
        const control = groupControls[0]
        const { data: master } = await admin.rpc('find_or_create_master_control', {
          p_title: control.title,
          p_description: control.summary_description,
          p_risk_level: control.default_risk_level || 'medium',
        })

        if (master) {
          // Create mapping
          await admin.from('framework_control_mappings').upsert(
            {
              master_control_id: master,
              framework_control_id: control.id,
              mapping_confidence: 1.0,
            },
            { onConflict: 'master_control_id,framework_control_id' }
          )
          created++
        }
      } else {
        // Multiple controls with same/similar title - deduplicate
        const primaryControl = groupControls[0]
        const { data: master } = await admin.rpc('find_or_create_master_control', {
          p_title: primaryControl.title,
          p_description: primaryControl.summary_description,
          p_risk_level: primaryControl.default_risk_level || 'medium',
        })

        if (master) {
          // Map all framework controls to this master
          for (const control of groupControls) {
            await admin.from('framework_control_mappings').upsert(
              {
                master_control_id: master,
                framework_control_id: control.id,
                mapping_confidence: 1.0,
              },
              { onConflict: 'master_control_id,framework_control_id' }
            )
            created++
          }
        }
      }
    }

    return { ok: true, created }
  } catch (error) {
    return {
      ok: false,
      created: 0,
      error: error instanceof Error ? error.message : 'Deduplication failed',
    }
  }
}

/**
 * Get master control with all framework mappings
 */
export async function getMasterControlWithMappings(
  masterControlId: string
): Promise<MasterControl | null> {
  const admin = createSupabaseAdminClient()

  const { data: master } = await admin
    .from('master_controls')
    .select('*')
    .eq('id', masterControlId)
    .maybeSingle()

  if (!master) return null

  const { data: mappings } = await admin
    .from('framework_control_mappings')
    .select(`
      framework_control:framework_controls (
        control_code,
        framework:frameworks (slug, name)
      )
    `)
    .eq('master_control_id', masterControlId)

  const frameworks = (mappings || []).map((m: any) => ({
    slug: m.framework_control.framework.slug,
    name: m.framework_control.framework.name,
    controlCode: m.framework_control.control_code,
  }))

  return {
    id: master.id,
    control_code: master.control_code,
    title: master.title,
    description: master.description,
    risk_level: master.risk_level,
    frameworks,
  }
}

/**
 * Get all frameworks satisfied by a master control for an org
 */
export async function getFrameworksSatisfiedByControl(
  orgId: string,
  masterControlId: string
): Promise<string[]> {
  const admin = createSupabaseAdminClient()

  // Get all framework controls mapped to this master
  const { data: mappings } = await admin
    .from('framework_control_mappings')
    .select(`
      framework_control:framework_controls (
        framework:frameworks (slug)
      )
    `)
    .eq('master_control_id', masterControlId)

  // Get frameworks enabled for this org
  const { data: enabledFrameworks } = await admin
    .from('org_frameworks')
    .select('framework_slug')
    .eq('org_id', orgId)

  const enabledSlugs = new Set((enabledFrameworks || []).map((f) => f.framework_slug))

  // Return intersection
  const satisfiedFrameworks = (mappings || [])
    .map((m: any) => m.framework_control.framework.slug)
    .filter((slug) => enabledSlugs.has(slug))

  return Array.from(new Set(satisfiedFrameworks))
}

/**
 * Check if control is deduplicated across frameworks
 */
export async function isControlDeduplicated(
  frameworkControlId: string
): Promise<{ deduplicated: boolean; frameworks: string[] }> {
  const admin = createSupabaseAdminClient()

  // Find master control for this framework control
  const { data: mapping } = await admin
    .from('framework_control_mappings')
    .select('master_control_id')
    .eq('framework_control_id', frameworkControlId)
    .maybeSingle()

  if (!mapping) {
    return { deduplicated: false, frameworks: [] }
  }

  // Get all frameworks mapped to same master
  const { data: allMappings } = await admin
    .from('framework_control_mappings')
    .select(`
      framework_control:framework_controls (
        framework:frameworks (slug, name)
      )
    `)
    .eq('master_control_id', mapping.master_control_id)

  const frameworks = (allMappings || []).map((m: any) => m.framework_control.framework.name)

  return {
    deduplicated: frameworks.length > 1,
    frameworks: Array.from(new Set(frameworks)),
  }
}
