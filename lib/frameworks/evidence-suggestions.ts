import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { FrameworkControlRow } from './types'

export type EvidenceSuggestion = {
  evidenceTypes: string[]
  taskTemplates: Array<{ title: string; description?: string | null; priority?: string | null }>
  automationTriggers: string[]
  reviewCadenceDays: number
}

const DEFAULT_EVIDENCE_BY_RISK: Record<string, string[]> = {
  low: ['Policy statement', 'Periodic review record'],
  medium: ['Policy or standard', 'Process evidence', 'Review log'],
  high: ['Policy', 'Operational evidence', 'Management review record'],
  critical: ['Policy', 'Technical evidence', 'Incident or exception log'],
}

const DEFAULT_TRIGGERS_BY_RISK: Record<string, string[]> = {
  low: ['policy_review_due'],
  medium: ['task_overdue'],
  high: ['control_incomplete', 'task_overdue'],
  critical: ['control_failed', 'task_overdue'],
}

function normalizeList(list?: string[] | null) {
  return (list ?? []).map((item) => String(item).trim()).filter(Boolean)
}

function riskKey(value?: string | null) {
  const normalized = (value ?? 'medium').toLowerCase()
  if (normalized === 'critical') return 'critical'
  if (normalized === 'high') return 'high'
  if (normalized === 'low') return 'low'
  return 'medium'
}

function defaultCadenceDays(riskLevel?: string | null) {
  const level = riskKey(riskLevel)
  if (level === 'critical') return 60
  if (level === 'high') return 90
  if (level === 'low') return 365
  return 180
}

function buildFallbackTasks(title: string) {
  const base = title.trim() || 'Control'
  return [
    {
      title: `Implement ${base}`,
      description: `Define and implement controls for ${base.toLowerCase()}.`,
      priority: 'medium',
    },
  ]
}

export function getEvidenceSuggestions(control: FrameworkControlRow): EvidenceSuggestion {
  const evidenceTypes = normalizeList(control.suggested_evidence_types)
  const automationTriggers = normalizeList(control.suggested_automation_triggers)
  const taskTemplates = (control.suggested_task_templates ?? []).length
    ? control.suggested_task_templates ?? []
    : buildFallbackTasks(control.title)

  const risk = riskKey(control.default_risk_level)

  return {
    evidenceTypes: evidenceTypes.length ? evidenceTypes : DEFAULT_EVIDENCE_BY_RISK[risk],
    taskTemplates,
    automationTriggers:
      automationTriggers.length ? automationTriggers : DEFAULT_TRIGGERS_BY_RISK[risk],
    reviewCadenceDays: control.review_frequency_days ?? defaultCadenceDays(risk),
  }
}

export async function getEvidenceSuggestionsForControl(
  frameworkSlug: string,
  controlCode: string,
): Promise<EvidenceSuggestion | null> {
  const admin = createSupabaseAdminClient()
  const { data: framework } = await admin
    .from('frameworks')
    .select('id')
    .eq('slug', frameworkSlug)
    .maybeSingle()

  if (!framework?.id) return null

  const { data: control } = await admin
    .from('framework_controls')
    .select(
      'id, framework_id, domain_id, control_code, title, summary_description, implementation_guidance, default_risk_level, review_frequency_days, suggested_evidence_types, suggested_automation_triggers, suggested_task_templates',
    )
    .eq('framework_id', framework.id)
    .eq('control_code', controlCode)
    .maybeSingle()

  if (!control) return null

  return getEvidenceSuggestions(control as FrameworkControlRow)
}
