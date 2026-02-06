import fs from 'fs/promises'
import path from 'path'
import { parse as parseYaml } from 'yaml'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { FrameworkPack, LoadFrameworkPackResult } from './types'

type FrameworkPackInput = FrameworkPack | { path: string } | string

type LoadFrameworkPackOptions = {
  adminClient?: ReturnType<typeof createSupabaseAdminClient>
  logger?: Pick<Console, 'info' | 'warn' | 'error'>
  dryRun?: boolean
}

const DEFAULT_LOGGER: Pick<Console, 'info' | 'warn' | 'error'> = console

async function fileExists(filePath: string) {
  try {
    const stat = await fs.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

function normalizePack(raw: unknown): FrameworkPack {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Framework pack must be an object')
  }
  const pack = raw as FrameworkPack
  if (!pack.framework || typeof pack.framework !== 'object') {
    throw new Error('Framework pack is missing the framework metadata')
  }
  if (!pack.framework.name || !pack.framework.slug) {
    throw new Error('Framework pack requires framework.name and framework.slug')
  }
  return pack
}

function parsePackContent(contents: string, filename?: string): FrameworkPack {
  const trimmed = contents.trim()
  const ext = filename ? path.extname(filename).toLowerCase() : ''

  if (ext === '.json') {
    return normalizePack(JSON.parse(trimmed))
  }

  if (ext === '.yaml' || ext === '.yml') {
    return normalizePack(parseYaml(trimmed))
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return normalizePack(JSON.parse(trimmed))
  }

  return normalizePack(parseYaml(trimmed))
}

async function resolvePack(input: FrameworkPackInput): Promise<FrameworkPack> {
  if (typeof input === 'string') {
    const possiblePath = input.trim()
    if (await fileExists(possiblePath)) {
      const contents = await fs.readFile(possiblePath, 'utf8')
      return parsePackContent(contents, possiblePath)
    }
    return parsePackContent(possiblePath)
  }

  if (typeof input === 'object' && 'path' in input && input.path) {
    const filePath = input.path
    const contents = await fs.readFile(filePath, 'utf8')
    return parsePackContent(contents, filePath)
  }

  return normalizePack(input)
}

function normalizeKey(value?: string | null) {
  return (value ?? '').trim().toLowerCase()
}

export async function loadFrameworkPack(
  input: FrameworkPackInput,
  options: LoadFrameworkPackOptions = {},
): Promise<LoadFrameworkPackResult> {
  const logger = options.logger ?? DEFAULT_LOGGER
  const warnings: string[] = []

  let pack: FrameworkPack
  try {
    pack = await resolvePack(input)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to parse framework pack',
      warnings,
    }
  }

  const admin = options.adminClient ?? createSupabaseAdminClient()
  const frameworkPayload = {
    name: pack.framework.name,
    slug: pack.framework.slug,
    version: pack.framework.version ?? null,
    description: pack.framework.description ?? null,
    is_active: pack.framework.is_active ?? true,
  }

  if (options.dryRun) {
    return {
      ok: true,
      frameworkId: 'dry-run',
      frameworkSlug: frameworkPayload.slug,
      domainsUpserted: pack.domains?.length ?? 0,
      controlsUpserted: pack.controls?.length ?? 0,
      mappingsUpserted: pack.mappings?.length ?? 0,
      warnings,
    }
  }

  const { data: frameworkData, error: frameworkError } = await admin
    .from('frameworks')
    .upsert(frameworkPayload, { onConflict: 'slug' })
    .select('id, slug')
    .maybeSingle()

  if (frameworkError || !frameworkData?.id) {
    logger.error('[FrameworkPack] Failed to upsert framework', frameworkError)
    return {
      ok: false,
      error: 'Failed to upsert framework metadata',
      warnings,
    }
  }

  const frameworkId = frameworkData.id as string
  const domainMap = new Map<string, { id: string; name: string }>()
  let domainsUpserted = 0
  let controlsUpserted = 0
  let mappingsUpserted = 0

  const ensureDomain = async (name: string, key: string) => {
    if (!name.trim()) return null
    const normalizedKey = normalizeKey(key)
    if (normalizedKey && domainMap.has(normalizedKey)) {
      return domainMap.get(normalizedKey)!.id
    }

    const { data: domainRow, error: domainError } = await admin
      .from('framework_domains')
      .upsert(
        {
          framework_id: frameworkId,
          name: name.trim(),
          description: null,
          sort_order: 0,
        },
        { onConflict: 'framework_id,name' },
      )
      .select('id, name')
      .maybeSingle()

    if (domainError || !domainRow?.id) {
      warnings.push(`Failed to auto-create domain: ${name.trim()}`)
      return null
    }

    domainsUpserted += 1
    const finalKey = normalizeKey(key || domainRow.name)
    domainMap.set(finalKey, { id: domainRow.id as string, name: domainRow.name as string })
    return domainRow.id as string
  }

  for (const domain of pack.domains ?? []) {
    if (!domain?.name) {
      warnings.push('Skipped domain with missing name')
      continue
    }

    const { data: domainRow, error: domainError } = await admin
      .from('framework_domains')
      .upsert(
        {
          framework_id: frameworkId,
          name: domain.name,
          description: domain.description ?? null,
          sort_order: Number.isFinite(Number(domain.sort_order))
            ? Number(domain.sort_order)
            : 0,
        },
        { onConflict: 'framework_id,name' },
      )
      .select('id, name')
      .maybeSingle()

    if (domainError || !domainRow?.id) {
      warnings.push(`Failed to upsert domain: ${domain.name}`)
      continue
    }

    domainsUpserted += 1
    const key = normalizeKey(domain.key ?? domain.name)
    domainMap.set(key, { id: domainRow.id as string, name: domainRow.name as string })
  }

  const controlIdMap = new Map<string, string>()

  for (const control of pack.controls ?? []) {
    if (!control?.control_code || !control?.title) {
      warnings.push('Skipped control with missing code or title')
      continue
    }

    let domainId = control.domain_id ?? null
    if (!domainId) {
      const domainKey = normalizeKey(control.domain_key ?? control.domain ?? '')
      if (domainKey && domainMap.has(domainKey)) {
        domainId = domainMap.get(domainKey)!.id
      } else if (domainKey) {
        const domainName = (control.domain ?? control.domain_key ?? '').trim()
        if (domainName) {
          domainId = await ensureDomain(domainName, domainKey)
        }
      }
    }

    if (!domainId) {
      warnings.push(`Skipped control ${control.control_code}: missing domain mapping`)
      continue
    }

    const { data: controlRow, error: controlError } = await admin
      .from('framework_controls')
      .upsert(
        {
          framework_id: frameworkId,
          domain_id: domainId,
          control_code: control.control_code,
          title: control.title,
          summary_description: control.summary_description ?? null,
          implementation_guidance: control.implementation_guidance ?? null,
          default_risk_level: control.default_risk_level ?? null,
          review_frequency_days: Number.isFinite(Number(control.review_frequency_days))
            ? Number(control.review_frequency_days)
            : null,
          suggested_evidence_types: control.suggested_evidence_types ?? null,
          suggested_automation_triggers: control.suggested_automation_triggers ?? null,
          suggested_task_templates: control.suggested_task_templates ?? [],
        },
        { onConflict: 'framework_id,control_code' },
      )
      .select('id, control_code')
      .maybeSingle()

    if (controlError || !controlRow?.id) {
      warnings.push(`Failed to upsert control: ${control.control_code}`)
      continue
    }

    controlsUpserted += 1
    controlIdMap.set(controlRow.control_code as string, controlRow.id as string)
  }

  for (const mapping of pack.mappings ?? []) {
    if (!mapping?.framework_slug || !mapping.external_control_reference) {
      warnings.push('Skipped mapping with missing framework_slug or external reference')
      continue
    }

    let internalControlId = mapping.internal_control_id ?? null
    if (!internalControlId && mapping.internal_control_code) {
      internalControlId = controlIdMap.get(mapping.internal_control_code) ?? null
    }

    if (!internalControlId) {
      warnings.push(`Skipped mapping for ${mapping.framework_slug}: missing internal control id`)
      continue
    }

    const strength = mapping.mapping_strength ?? 'secondary'
    const normalizedStrength = strength === 'primary' ? 'primary' : 'secondary'

    const { error: mappingError } = await admin
      .from('control_mappings')
      .upsert(
        {
          internal_control_id: internalControlId,
          framework_slug: mapping.framework_slug,
          external_control_reference: mapping.external_control_reference,
          mapping_strength: normalizedStrength,
        },
        { onConflict: 'internal_control_id,framework_slug,external_control_reference' },
      )

    if (mappingError) {
      warnings.push(`Failed to upsert mapping for ${mapping.framework_slug}`)
      continue
    }

    mappingsUpserted += 1
  }

  if (warnings.length) {
    logger.warn('[FrameworkPack] Completed with warnings', warnings)
  }

  return {
    ok: true,
    frameworkId,
    frameworkSlug: frameworkPayload.slug,
    domainsUpserted,
    controlsUpserted,
    mappingsUpserted,
    warnings,
  }
}
