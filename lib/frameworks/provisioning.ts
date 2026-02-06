import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  ensureFrameworkPacksInstalled,
  getFrameworkCodeForSlug,
  syncComplianceFramework,
} from './framework-installer'
import { getEvidenceSuggestions } from './evidence-suggestions'
import type { FrameworkControlRow } from './types'
import { getServerSideFeatureFlags } from '@/lib/feature-flags'
import {
  detectComplianceControlsSchema,
  riskLevelFromWeight,
} from './compliance-controls-schema'

const DEFAULT_TASK_PRIORITY_BY_RISK: Record<string, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'high',
}

function riskKey(value?: string | null) {
  const normalized = (value ?? 'medium').toLowerCase()
  if (normalized === 'critical') return 'critical'
  if (normalized === 'high') return 'high'
  if (normalized === 'low') return 'low'
  return 'medium'
}

function defaultDueDate(riskLevel?: string | null) {
  const level = riskKey(riskLevel)
  const now = new Date()
  if (level === 'critical') now.setDate(now.getDate() + 14)
  else if (level === 'high') now.setDate(now.getDate() + 30)
  else if (level === 'low') now.setDate(now.getDate() + 90)
  else now.setDate(now.getDate() + 60)
  return now.toISOString()
}

type FrameworkProvisionOptions = {
  force?: boolean
  client?: any
}

export async function enableFrameworkForOrg(
  orgId: string,
  frameworkSlug: string,
  options: FrameworkProvisionOptions = {},
) {
  const flags = getServerSideFeatureFlags()
  if (!flags.enableFrameworkEngine && !options.force) return

  await ensureFrameworkPacksInstalled()
  const admin = options.client ?? createSupabaseAdminClient()

  await admin.from('org_frameworks').upsert(
    {
      org_id: orgId,
      framework_slug: frameworkSlug,
      enabled_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,framework_slug' },
  )

  await provisionFrameworkControls(orgId, frameworkSlug, options)
}

export async function provisionFrameworkControls(
  orgId: string,
  frameworkSlug: string,
  options: FrameworkProvisionOptions = {},
) {
  const flags = getServerSideFeatureFlags()
  if (!flags.enableFrameworkEngine && !options.force) return

  await ensureFrameworkPacksInstalled()
  const admin = options.client ?? createSupabaseAdminClient()
  await syncComplianceFramework(frameworkSlug, admin)

  await admin.from('org_frameworks').upsert(
    {
      org_id: orgId,
      framework_slug: frameworkSlug,
      enabled_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,framework_slug' },
  )
  const frameworkCode = getFrameworkCodeForSlug(frameworkSlug)

  const { data: complianceFramework } = await admin
    .from('compliance_frameworks')
    .select('id, code')
    .eq('code', frameworkCode)
    .maybeSingle()

  if (!complianceFramework?.id) return

  const schema = await detectComplianceControlsSchema(admin)
  let complianceControls: any[] | null = null

  if (schema === 'legacy') {
    const { data } = await admin
      .from('compliance_controls')
      .select('id, code, title, description, risk_weight, framework_control_id')
      .eq('framework_id', complianceFramework.id)
    complianceControls = (data ?? []).map((control: any) => ({
      ...control,
      risk_level: riskLevelFromWeight(control.risk_weight),
    }))
  } else {
    const { data } = await admin
      .from('compliance_controls')
      .select('id, code, title, description, risk_level, framework_control_id')
      .eq('framework_id', complianceFramework.id)
    complianceControls = data ?? []
  }

  if (!complianceControls?.length) return

  const controlIds = complianceControls.map((control: any) => control.id)

  const { data: existingLinks } = await admin
    .from('control_tasks')
    .select('control_id')
    .eq('organization_id', orgId)
    .in('control_id', controlIds)

  const existingControlIds = new Set((existingLinks ?? []).map((row: any) => row.control_id))

  const frameworkControlIds = complianceControls
    .map((control: any) => control.framework_control_id)
    .filter(Boolean)

  const { data: frameworkControls } = frameworkControlIds.length
    ? await admin
        .from('framework_controls')
        .select(
          'id, control_code, title, summary_description, default_risk_level, review_frequency_days, suggested_evidence_types, suggested_automation_triggers, suggested_task_templates',
        )
        .in('id', frameworkControlIds)
    : { data: [] }

  const frameworkControlById = new Map(
    (frameworkControls ?? []).map((control: any) => [control.id as string, control]),
  )

  const evaluations: any[] = []

  for (const control of complianceControls as any[]) {
    if (existingControlIds.has(control.id)) {
      continue
    }

    const frameworkControl = control.framework_control_id
      ? (frameworkControlById.get(control.framework_control_id) as FrameworkControlRow | undefined)
      : undefined

    const suggestions = frameworkControl
      ? getEvidenceSuggestions(frameworkControl)
      : {
          evidenceTypes: [],
          automationTriggers: [],
          reviewCadenceDays: 90,
          taskTemplates: [
            {
              title: `Implement ${control.title}`,
              description: control.description ?? 'Define and implement required control activities.',
              priority: 'medium',
            },
          ],
        }

    const template = suggestions.taskTemplates[0]
    const priority = template.priority ?? DEFAULT_TASK_PRIORITY_BY_RISK[riskKey(control.risk_level)]

    const { data: taskRow, error: taskError } = await admin
      .from('org_tasks')
      .insert({
        organization_id: orgId,
        title: template.title,
        description: template.description ?? control.description ?? null,
        status: 'pending',
        priority,
        due_date: defaultDueDate(control.risk_level ?? frameworkControl?.default_risk_level),
      })
      .select('id')
      .maybeSingle()

    if (taskError || !taskRow?.id) {
      continue
    }

    await admin.from('control_tasks').insert({
      organization_id: orgId,
      control_id: control.id,
      task_id: taskRow.id,
    })

    evaluations.push({
      organization_id: orgId,
      control_type: 'framework_control',
      control_key: `control:${control.id}`,
      required: true,
      status: 'at_risk',
      last_evaluated_at: new Date().toISOString(),
      framework_id: complianceFramework.id,
      details: {
        framework_code: complianceFramework.code,
        control_code: control.code,
        control_title: control.title,
        required_evidence_count: 1,
        approved_evidence_count: 0,
        evidence_types: suggestions.evidenceTypes,
        automation_triggers: suggestions.automationTriggers,
      },
    })
  }

  if (evaluations.length) {
    await admin.from('org_control_evaluations').upsert(evaluations, {
      onConflict: 'organization_id,control_type,control_key',
    })
  }
}
