import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureFrameworkPacksInstalled, PACK_SLUGS } from './framework-installer'
import { getServerSideFeatureFlags } from '@/lib/feature-flags'

const ORG_FRAMEWORK_MAP: Record<string, string> = {
  soc2: 'soc2',
  'nist-csf': 'nist-csf',
  nist: 'nist-csf',
  'cis-controls': 'cis-controls',
  cis: 'cis-controls',
  iso27001: 'iso27001',
  iso: 'iso27001',
  gdpr: 'gdpr',
  hipaa: 'hipaa',
  pci: 'pci-dss',
  'pci-dss': 'pci-dss',
}

function normalizeFrameworkSlug(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (PACK_SLUGS.includes(normalized)) return normalized
  return ORG_FRAMEWORK_MAP[normalized] ?? null
}

export async function syncOrgFrameworksFromOrgRecord(orgId: string) {
  const flags = getServerSideFeatureFlags()
  if (!flags.enableFrameworkEngine) return []

  await ensureFrameworkPacksInstalled()
  const admin = createSupabaseAdminClient()

  const { data: orgRow } = await admin
    .from('organizations')
    .select('frameworks')
    .eq('id', orgId)
    .maybeSingle()

  const frameworksRaw = Array.isArray(orgRow?.frameworks) ? orgRow?.frameworks : []
  const slugs = Array.from(
    new Set(
      frameworksRaw
        .map((entry: any) => normalizeFrameworkSlug(String(entry)))
        .filter((slug: string | null): slug is string => Boolean(slug)),
    ),
  )

  if (!slugs.length) return []

  const rows = slugs.map((slug) => ({
    org_id: orgId,
    framework_slug: slug,
    enabled_at: new Date().toISOString(),
  }))

  await admin.from('org_frameworks').upsert(rows, { onConflict: 'org_id,framework_slug' })

  return slugs
}

export async function getOrgFrameworkOverview(orgId: string) {
  const flags = getServerSideFeatureFlags()
  if (!flags.enableFrameworkEngine) return []

  await ensureFrameworkPacksInstalled()
  await syncOrgFrameworksFromOrgRecord(orgId)

  const admin = createSupabaseAdminClient()
  const { data: enabled } = await admin
    .from('org_frameworks')
    .select('framework_slug, enabled_at')
    .eq('org_id', orgId)

  const enabledSlugs = (enabled ?? []).map((row: any) => row.framework_slug)
  if (!enabledSlugs.length) return []

  const { data: frameworks } = await admin
    .from('frameworks')
    .select('id, name, slug, version, description, is_active')
    .in('slug', enabledSlugs)

  const frameworkById = new Map((frameworks ?? []).map((fw: any) => [fw.id, fw]))
  const frameworkBySlug = new Map((frameworks ?? []).map((fw: any) => [fw.slug, fw]))

  const frameworkIds = (frameworks ?? []).map((fw: any) => fw.id)
  if (!frameworkIds.length) {
    return enabledSlugs.map((slug: string) => ({
      slug,
      name: slug.toUpperCase(),
      description: null,
      version: null,
      is_active: true,
      controlCount: 0,
      domains: [],
      enabledAt: enabled?.find((row: any) => row.framework_slug === slug)?.enabled_at ?? null,
    }))
  }

  const [domains, controls] = await Promise.all([
    admin
      .from('framework_domains')
      .select('id, framework_id, name, sort_order')
      .in('framework_id', frameworkIds),
    admin
      .from('framework_controls')
      .select('id, framework_id, domain_id')
      .in('framework_id', frameworkIds),
  ])

  const domainRows = domains.data ?? []
  const controlRows = controls.data ?? []

  const controlsByFramework = new Map<string, number>()
  const controlsByDomain = new Map<string, number>()

  controlRows.forEach((control: any) => {
    controlsByFramework.set(
      control.framework_id,
      (controlsByFramework.get(control.framework_id) ?? 0) + 1,
    )
    if (control.domain_id) {
      controlsByDomain.set(
        control.domain_id,
        (controlsByDomain.get(control.domain_id) ?? 0) + 1,
      )
    }
  })

  return enabledSlugs.map((slug: string) => {
    const framework = frameworkBySlug.get(slug) as any
    const frameworkId = framework?.id
    const domainSummary = domainRows
      .filter((domain: any) => domain.framework_id === frameworkId)
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((domain: any) => ({
        id: domain.id,
        name: domain.name,
        controlCount: controlsByDomain.get(domain.id) ?? 0,
      }))

    return {
      id: framework?.id ?? null,
      slug,
      name: framework?.name ?? slug.toUpperCase(),
      description: framework?.description ?? null,
      version: framework?.version ?? null,
      is_active: framework?.is_active ?? true,
      controlCount: frameworkId ? controlsByFramework.get(frameworkId) ?? 0 : 0,
      domains: domainSummary,
      enabledAt: enabled?.find((row: any) => row.framework_slug === slug)?.enabled_at ?? null,
    }
  })
}

export async function getCurrentOrgId() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership?.organization_id) throw new Error('Organization not found')

  return membership.organization_id as string
}
