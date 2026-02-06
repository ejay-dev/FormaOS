import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerSideFeatureFlags } from '@/lib/feature-flags'
import { ensureFrameworkPacksInstalled } from './framework-installer'
import type { FrameworkControlRow, FrameworkDomainRow, FrameworkRegistryRow } from './types'

function isFrameworkEngineEnabled() {
  const flags = getServerSideFeatureFlags()
  return Boolean(flags.enableFrameworkEngine)
}

export async function getAvailableFrameworks(): Promise<FrameworkRegistryRow[]> {
  if (!isFrameworkEngineEnabled()) {
    return []
  }

  await ensureFrameworkPacksInstalled()

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('frameworks')
    .select('id, name, slug, version, description, is_active')
    .order('name', { ascending: true })

  if (error) {
    console.error('[FrameworkRegistry] Failed to load frameworks:', error)
    return []
  }

  return (data ?? []) as FrameworkRegistryRow[]
}

export async function getFrameworkDomains(frameworkSlug: string): Promise<FrameworkDomainRow[]> {
  if (!isFrameworkEngineEnabled()) {
    return []
  }

  await ensureFrameworkPacksInstalled()

  const admin = createSupabaseAdminClient()
  const { data: framework } = await admin
    .from('frameworks')
    .select('id')
    .eq('slug', frameworkSlug)
    .maybeSingle()

  if (!framework?.id) {
    return []
  }

  const { data, error } = await admin
    .from('framework_domains')
    .select('id, framework_id, name, description, sort_order')
    .eq('framework_id', framework.id)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[FrameworkRegistry] Failed to load domains:', error)
    return []
  }

  return (data ?? []) as FrameworkDomainRow[]
}

export async function getFrameworkControls(frameworkSlug: string): Promise<FrameworkControlRow[]> {
  if (!isFrameworkEngineEnabled()) {
    return []
  }

  await ensureFrameworkPacksInstalled()

  const admin = createSupabaseAdminClient()
  const { data: framework } = await admin
    .from('frameworks')
    .select('id')
    .eq('slug', frameworkSlug)
    .maybeSingle()

  if (!framework?.id) {
    return []
  }

  const { data, error } = await admin
    .from('framework_controls')
    .select(
      'id, framework_id, domain_id, control_code, title, summary_description, implementation_guidance, default_risk_level, review_frequency_days',
    )
    .eq('framework_id', framework.id)
    .order('control_code', { ascending: true })

  if (error) {
    console.error('[FrameworkRegistry] Failed to load controls:', error)
    return []
  }

  return (data ?? []) as FrameworkControlRow[]
}
