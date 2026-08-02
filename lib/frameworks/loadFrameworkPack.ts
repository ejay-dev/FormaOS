import fs from 'fs/promises'
import path from 'path'
import { parse as parseYaml } from 'yaml'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { verifyFrameworkPackFile, FRAMEWORK_PACKS_DIR } from './manifest'
import type { FrameworkPack, LoadFrameworkPackResult } from './types'

type FrameworkPackInput = FrameworkPack | { path: string } | string

type LoadFrameworkPackOptions = {
  adminClient?: ReturnType<typeof createSupabaseAdminClient>
  logger?: Pick<Console, 'info' | 'warn' | 'error'>
  dryRun?: boolean
}

const DEFAULT_LOGGER: Pick<Console, 'info' | 'warn' | 'error'> = console

// Rows sent per upsert statement. Pack installs run on the request path via
// ensureFrameworkPacksInstalled(), so every row must not cost a round-trip.
const BATCH_SIZE = 200

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

/**
 * Read the file's contents — going through manifest verification when
 * the path lives inside framework-packs/. Files outside that directory
 * (e.g. a developer-provided pack passed by absolute path) are not
 * integrity-checked, since the manifest covers shipped packs only.
 */
async function readPackFileChecked(filePath: string): Promise<string> {
  const absolute = path.resolve(filePath)
  const inFrameworkPacks = absolute.startsWith(FRAMEWORK_PACKS_DIR + path.sep)
  if (!inFrameworkPacks) {
    return fs.readFile(absolute, 'utf8')
  }
  return verifyFrameworkPackFile(absolute)
}

async function resolvePack(input: FrameworkPackInput): Promise<FrameworkPack> {
  if (typeof input === 'string') {
    const possiblePath = input.trim()
    if (await fileExists(possiblePath)) {
      const contents = await readPackFileChecked(possiblePath)
      return parsePackContent(contents, possiblePath)
    }
    return parsePackContent(possiblePath)
  }

  if (typeof input === 'object' && 'path' in input && input.path) {
    const filePath = input.path
    const contents = await readPackFileChecked(filePath)
    return parsePackContent(contents, filePath)
  }

  return normalizePack(input)
}

function normalizeKey(value?: string | null) {
  return (value ?? '').trim().toLowerCase()
}

// upsert().select() answers with a row array, but a single-row response shape
// is accepted too so a batch never depends on the client's row-count handling.
function toRowArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  return data ? [data as T] : []
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

  const chunkRows = <T>(rows: T[], size = BATCH_SIZE): T[][] => {
    const chunks: T[][] = []
    for (let index = 0; index < rows.length; index += size) {
      chunks.push(rows.slice(index, index + size))
    }
    return chunks
  }

  type DomainEntry = {
    name: string
    description: string | null
    sortOrder: number
    key: string
  }

  const upsertDomains = async (entries: DomainEntry[], autoCreated: boolean) => {
    // The conflict target is (framework_id, name), so a batch may never carry
    // the same name twice — Postgres rejects the whole statement if it does.
    const byName = new Map<string, DomainEntry[]>()
    for (const entry of entries) {
      const group = byName.get(entry.name)
      if (group) group.push(entry)
      else byName.set(entry.name, [entry])
    }

    for (const batch of chunkRows([...byName.entries()])) {
      const { data: domainRows, error: domainError } = await admin
        .from('framework_domains')
        .upsert(
          batch.map(([name, group]) => ({
            framework_id: frameworkId,
            name,
            description: group[0].description,
            sort_order: group[0].sortOrder,
          })),
          { onConflict: 'framework_id,name' },
        )
        .select('id, name')

      const upsertedDomains = toRowArray<{ id: string; name: string }>(
        domainError ? null : domainRows,
      )

      const idByName = new Map(
        upsertedDomains.map((row) => [row.name, row.id] as const),
      )

      for (const [name, group] of batch) {
        const domainId = idByName.get(name)
        if (!domainId) {
          warnings.push(
            autoCreated
              ? `Failed to auto-create domain: ${name}`
              : `Failed to upsert domain: ${name}`,
          )
          continue
        }
        for (const entry of group) {
          domainsUpserted += 1
          domainMap.set(entry.key || normalizeKey(name), { id: domainId, name })
        }
      }
    }
  }

  const packDomains: DomainEntry[] = []
  for (const domain of pack.domains ?? []) {
    if (!domain?.name) {
      warnings.push('Skipped domain with missing name')
      continue
    }

    packDomains.push({
      name: domain.name,
      description: domain.description ?? null,
      sortOrder: Number.isFinite(Number(domain.sort_order)) ? Number(domain.sort_order) : 0,
      key: normalizeKey(domain.key ?? domain.name),
    })
  }

  await upsertDomains(packDomains, false)

  // Domains referenced only by a control are created up front, in one batch,
  // so the control upsert below has every domain id resolved before it runs.
  const autoDomains = new Map<string, DomainEntry>()
  for (const control of pack.controls ?? []) {
    if (!control?.control_code || !control?.title) continue
    if (control.domain_id) continue

    const domainKey = normalizeKey(control.domain_key ?? control.domain ?? '')
    if (!domainKey || domainMap.has(domainKey) || autoDomains.has(domainKey)) continue

    const domainName = (control.domain ?? control.domain_key ?? '').trim()
    if (!domainName) continue

    autoDomains.set(domainKey, {
      name: domainName,
      description: null,
      sortOrder: 0,
      key: domainKey,
    })
  }

  if (autoDomains.size) {
    await upsertDomains([...autoDomains.values()], true)
  }

  const controlIdMap = new Map<string, string>()
  const controlRowsByCode = new Map<string, Record<string, unknown>>()

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
      }
    }

    if (!domainId) {
      warnings.push(`Skipped control ${control.control_code}: missing domain mapping`)
      continue
    }

    // Same conflict-target rule as domains: one row per control_code per batch.
    if (controlRowsByCode.has(control.control_code)) continue

    controlRowsByCode.set(control.control_code, {
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
    })
  }

  for (const batch of chunkRows([...controlRowsByCode.values()])) {
    const { data: controlRows, error: controlError } = await admin
      .from('framework_controls')
      .upsert(batch, { onConflict: 'framework_id,control_code' })
      .select('id, control_code')

    const upsertedControls = toRowArray<{ id: string; control_code: string }>(
      controlError ? null : controlRows,
    )

    const idByCode = new Map(
      upsertedControls.map((row) => [row.control_code, row.id] as const),
    )

    for (const row of batch) {
      const controlCode = row.control_code as string
      const controlId = idByCode.get(controlCode)
      if (!controlId) {
        warnings.push(`Failed to upsert control: ${controlCode}`)
        continue
      }
      controlsUpserted += 1
      controlIdMap.set(controlCode, controlId)
    }
  }

  const mappingRowsByKey = new Map<string, Record<string, unknown>>()

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

    const conflictKey = `${internalControlId}|${mapping.framework_slug}|${mapping.external_control_reference}`
    if (mappingRowsByKey.has(conflictKey)) continue

    mappingRowsByKey.set(conflictKey, {
      internal_control_id: internalControlId,
      framework_slug: mapping.framework_slug,
      external_control_reference: mapping.external_control_reference,
      mapping_strength: normalizedStrength,
    })
  }

  for (const batch of chunkRows([...mappingRowsByKey.values()])) {
    const { error: mappingError } = await admin
      .from('control_mappings')
      .upsert(batch, {
        onConflict: 'internal_control_id,framework_slug,external_control_reference',
      })

    if (mappingError) {
      for (const row of batch) {
        warnings.push(`Failed to upsert mapping for ${row.framework_slug}`)
      }
      continue
    }

    mappingsUpserted += batch.length
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
