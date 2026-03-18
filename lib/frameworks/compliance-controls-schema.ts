import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type ComplianceControlsSchema = 'modern' | 'legacy'

let cachedSchema: ComplianceControlsSchema | null = null

export async function detectComplianceControlsSchema(
  adminClient?: ReturnType<typeof createSupabaseAdminClient>,
): Promise<ComplianceControlsSchema> {
  if (cachedSchema) return cachedSchema
  const admin = adminClient ?? createSupabaseAdminClient()
  const { error } = await admin
    .from('compliance_controls')
    .select('category, risk_level, weight, required_evidence_count')
    .limit(1)

  cachedSchema = error ? 'legacy' : 'modern'
  return cachedSchema
}

export function riskWeightFromLevel(level?: string | null): number {
  const normalized = (level ?? 'medium').toLowerCase()
  if (normalized === 'critical') return 8
  if (normalized === 'high') return 5
  if (normalized === 'low') return 1
  return 3
}

export function riskLevelFromWeight(weight?: number | null): string {
  const value = Number(weight ?? 3)
  if (value >= 7) return 'critical'
  if (value >= 5) return 'high'
  if (value <= 1) return 'low'
  return 'medium'
}
