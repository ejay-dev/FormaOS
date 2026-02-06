export type FrameworkPack = {
  framework: {
    name: string
    slug: string
    version?: string | null
    description?: string | null
    is_active?: boolean | null
  }
  domains?: Array<{
    name: string
    description?: string | null
    sort_order?: number | null
    key?: string | null
  }>
  controls?: Array<{
    control_code: string
    title: string
    summary_description?: string | null
    implementation_guidance?: string | null
    default_risk_level?: string | null
    review_frequency_days?: number | null
    domain?: string | null
    domain_key?: string | null
    domain_id?: string | null
    suggested_evidence_types?: string[] | null
    suggested_automation_triggers?: string[] | null
    suggested_task_templates?: Array<{
      title: string
      description?: string | null
      priority?: string | null
    }> | null
  }>
  mappings?: Array<{
    internal_control_id?: string | null
    internal_control_code?: string | null
    framework_slug: string
    external_control_reference: string
    mapping_strength?: 'primary' | 'secondary' | null
  }>
}

export type LoadFrameworkPackResult =
  | {
      ok: true
      frameworkId: string
      frameworkSlug: string
      domainsUpserted: number
      controlsUpserted: number
      mappingsUpserted: number
      warnings: string[]
    }
  | {
      ok: false
      error: string
      warnings: string[]
    }

export type FrameworkRegistryRow = {
  id: string
  name: string
  slug: string
  version: string | null
  description: string | null
  is_active: boolean
}

export type FrameworkDomainRow = {
  id: string
  framework_id: string
  name: string
  description: string | null
  sort_order: number
}

export type FrameworkControlRow = {
  id: string
  framework_id: string
  domain_id: string
  control_code: string
  title: string
  summary_description: string | null
  implementation_guidance: string | null
  default_risk_level: string | null
  review_frequency_days: number | null
  suggested_evidence_types?: string[] | null
  suggested_automation_triggers?: string[] | null
  suggested_task_templates?: Array<{
    title: string
    description?: string | null
    priority?: string | null
  }> | null
}
