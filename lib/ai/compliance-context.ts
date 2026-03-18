import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Build a system prompt enriched with organisation-specific compliance data.
 * Keeps total context under ~800 tokens to leave room for conversation history.
 */
export async function buildComplianceContext(orgId: string): Promise<string> {
  const admin = createSupabaseAdminClient();

  // Run all queries in parallel for speed
  const [orgResult, evaluationsResult, policiesResult, evidenceResult, frameworksResult, soc2Result] =
    await Promise.all([
      // 1. Organization name and industry
      admin
        .from('organizations')
        .select('name, industry')
        .eq('id', orgId)
        .maybeSingle(),

      // 2. Control evaluations for compliance metrics
      admin
        .from('org_control_evaluations')
        .select('status')
        .eq('organization_id', orgId),

      // 3. Policy names and statuses
      admin
        .from('org_policies')
        .select('title, status')
        .eq('organization_id', orgId),

      // 4. Evidence by status
      admin
        .from('org_evidence')
        .select('status')
        .eq('organization_id', orgId),

      // 5. Enabled frameworks
      admin
        .from('org_frameworks')
        .select('framework_key, enabled')
        .eq('organization_id', orgId)
        .eq('enabled', true),

      // 6. Latest SOC 2 readiness score
      admin
        .from('soc2_readiness_assessments')
        .select('overall_score')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // Parse organization info
  const org = orgResult.data as Record<string, unknown> | null;
  const orgName = (org?.name as string) || 'Unknown Organization';
  const industry = (org?.industry as string) || 'Not specified';

  // Parse control evaluations
  const evaluations = (evaluationsResult.data ?? []) as Array<Record<string, unknown>>;
  const totalControls = evaluations.length;
  const satisfied = evaluations.filter((e) => e.status === 'satisfied').length;
  const partial = evaluations.filter((e) => e.status === 'partial').length;
  const missing = evaluations.filter(
    (e) => e.status !== 'satisfied' && e.status !== 'partial',
  ).length;
  const complianceScore =
    totalControls > 0
      ? Math.round(((satisfied + partial * 0.5) / totalControls) * 100)
      : 0;

  // Parse policies
  const policies = (policiesResult.data ?? []) as Array<Record<string, unknown>>;
  const policyCount = policies.length;
  const published = policies.filter((p) => p.status === 'published').length;

  // Parse evidence
  const evidence = (evidenceResult.data ?? []) as Array<Record<string, unknown>>;
  const evidenceCount = evidence.length;
  const verified = evidence.filter(
    (e) => e.status === 'verified' || e.status === 'approved',
  ).length;
  const pending = evidence.filter((e) => e.status === 'pending').length;

  // Parse frameworks
  const frameworks = (frameworksResult.data ?? []) as Array<Record<string, unknown>>;
  const frameworkList =
    frameworks.length > 0
      ? frameworks.map((f) => f.framework_key as string).join(', ')
      : 'None enabled';

  // SOC 2 readiness
  const soc2 = soc2Result.data as Record<string, unknown> | null;
  const soc2Line =
    soc2?.overall_score != null
      ? `\n- SOC 2 Readiness Score: ${soc2.overall_score}%`
      : '';

  return `You are FormaOS Compliance AI, an expert compliance assistant for ${orgName}.

ORGANIZATION CONTEXT:
- Industry: ${industry}
- Enabled Frameworks: ${frameworkList}
- Overall Compliance Score: ${complianceScore}%
- Controls: ${satisfied} satisfied, ${partial} partial, ${missing} missing (${totalControls} total)
- Evidence: ${evidenceCount} artifacts (${verified} verified, ${pending} pending)
- Policies: ${policyCount} documented (${published} published)${soc2Line}

INSTRUCTIONS:
- Be precise and reference specific control codes when relevant.
- Base answers on the organization's actual compliance data above.
- When suggesting actions, be specific and actionable.
- Format responses in markdown for readability.
- Never fabricate compliance data. If you don't have info, say so.`;
}
