import path from 'path'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { loadFrameworkPack } from './loadFrameworkPack'

const PACK_REGISTRY = [
  { slug: 'nist-csf', file: 'nist-csf.json', code: 'NIST_CSF' },
  { slug: 'cis-controls', file: 'cis-controls.json', code: 'CIS_CONTROLS' },
  { slug: 'soc2', file: 'soc2.json', code: 'SOC2' },
  { slug: 'iso27001', file: 'iso27001.json', code: 'ISO27001' },
  { slug: 'gdpr', file: 'gdpr.json', code: 'GDPR' },
  { slug: 'hipaa', file: 'hipaa.json', code: 'HIPAA' },
  { slug: 'pci-dss', file: 'pci-dss.json', code: 'PCIDSS' },
]

export const PACK_SLUGS = PACK_REGISTRY.map((pack) => pack.slug)

let installPromise: Promise<void> | null = null

export function getFrameworkCodeForSlug(slug: string) {
  const found = PACK_REGISTRY.find((pack) => pack.slug === slug)
  return found?.code ?? slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}

export function getPackFileForSlug(slug: string) {
  const found = PACK_REGISTRY.find((pack) => pack.slug === slug)
  if (!found) return null
  return path.join(process.cwd(), 'framework-packs', found.file)
}

async function syncComplianceFramework(slug: string) {
  const admin = createSupabaseAdminClient()
  const { data: framework } = await admin
    .from('frameworks')
    .select('id, name, description, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!framework?.id) return

  const frameworkCode = getFrameworkCodeForSlug(slug)
  const { data: complianceFramework } = await admin
    .from('compliance_frameworks')
    .upsert(
      {
        code: frameworkCode,
        title: framework.name,
        description: framework.description ?? null,
      },
      { onConflict: 'code' },
    )
    .select('id, code')
    .maybeSingle()

  if (!complianceFramework?.id) return

  const { data: domains } = await admin
    .from('framework_domains')
    .select('id, name')
    .eq('framework_id', framework.id)

  const domainNameById = new Map(
    (domains ?? []).map((domain: any) => [domain.id as string, domain.name as string]),
  )

  const { data: controls } = await admin
    .from('framework_controls')
    .select(
      'id, domain_id, control_code, title, summary_description, default_risk_level',
    )
    .eq('framework_id', framework.id)

  if (!controls?.length) return

  const rows = controls.map((control: any) => ({
    framework_id: complianceFramework.id,
    code: control.control_code,
    title: control.title,
    description: control.summary_description ?? null,
    category: domainNameById.get(control.domain_id) ?? 'General',
    risk_level: control.default_risk_level ?? 'medium',
    weight: 1,
    required_evidence_count: 1,
    is_mandatory: true,
    framework_control_id: control.id,
  }))

  await admin.from('compliance_controls').upsert(rows, {
    onConflict: 'framework_id,code',
  })
}

export async function ensureFrameworkPacksInstalled() {
  if (installPromise) return installPromise

  installPromise = (async () => {
    try {
      const admin = createSupabaseAdminClient()

      for (const pack of PACK_REGISTRY) {
        const filePath = path.join(process.cwd(), 'framework-packs', pack.file)
        await loadFrameworkPack({ path: filePath }, { adminClient: admin })
        await syncComplianceFramework(pack.slug)
      }
    } catch (error) {
      console.error('[framework-installer] Failed to install packs:', error)
    }
  })()

  return installPromise
}

export async function installFrameworkPack(slug: string) {
  const filePath = getPackFileForSlug(slug)
  if (!filePath) {
    throw new Error(`Unknown framework pack: ${slug}`)
  }

  const admin = createSupabaseAdminClient()
  await loadFrameworkPack({ path: filePath }, { adminClient: admin })
  await syncComplianceFramework(slug)
}
