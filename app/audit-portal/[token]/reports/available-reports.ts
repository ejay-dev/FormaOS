import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import type { ReportType } from '@/lib/audit-reports/types';

/**
 * Framework packs the report builder has a template for. Packs with no entry
 * (GDPR, PCI DSS, CIS, NIST CSF, AU financial services, mental health) have no
 * generator yet, so no report is offered for them.
 */
const REPORT_FOR_PACK: Record<string, ReportType> = {
  soc2: 'soc2',
  'soc2-tsc': 'soc2',
  iso27001: 'iso27001',
  'iso27001-2022': 'iso27001',
  ndis: 'ndis',
  hipaa: 'hipaa',
};

export const REPORT_DETAILS: Record<
  ReportType,
  { name: string; description: string }
> = {
  soc2: {
    name: 'SOC 2 readiness report',
    description:
      'Control status, evidence coverage and open gaps against the Trust Services Criteria.',
  },
  iso27001: {
    name: 'ISO 27001 snapshot',
    description:
      'Statement of Applicability coverage with an implementation status for each control.',
  },
  ndis: {
    name: 'NDIS Practice Standards snapshot',
    description:
      'Practice standard coverage with incident and staff credential summaries.',
  },
  hipaa: {
    name: 'HIPAA snapshot',
    description:
      'Privacy, security and breach notification rule coverage with a PHI system inventory.',
  },
  trust: {
    name: 'Buyer trust packet',
    description:
      'One summary across every framework this organisation has enabled.',
  },
};

/**
 * Framework slugs the org has enabled. org_frameworks is the provisioned
 * table, but it is populated by a sync from organizations.frameworks, so an
 * org that has chosen frameworks and not yet been synced falls back to the
 * column the sync reads from.
 */
async function getEnabledFrameworkSlugs(orgId: string): Promise<string[]> {
  const db = createSupabaseOrgClient(orgId);

  const { data: enabled } = await db
    .from('org_frameworks')
    .select('framework_slug');
  const slugs = ((enabled ?? []) as { framework_slug: string | null }[])
    .map((row) => row.framework_slug)
    .filter((slug): slug is string => Boolean(slug));
  if (slugs.length > 0) return slugs.map((slug) => slug.toLowerCase());

  const { data: org } = await db
    .from('organizations')
    .select('frameworks')
    .maybeSingle();
  const declared = (org as { frameworks?: unknown } | null)?.frameworks;
  if (!Array.isArray(declared)) return [];
  return declared.map((entry) => String(entry).trim().toLowerCase());
}

/**
 * Reports this auditor may download: the org's enabled frameworks, narrowed
 * to the token's framework scope when one is set.
 */
export async function getAvailableReportTypes(
  orgId: string,
  scopes: unknown,
): Promise<ReportType[]> {
  const scopedSlugs = (
    (scopes as { frameworks?: string[] } | null)?.frameworks ?? []
  ).map((slug) => slug.trim().toLowerCase());
  const enabledSlugs = await getEnabledFrameworkSlugs(orgId);
  const visibleSlugs =
    scopedSlugs.length > 0
      ? enabledSlugs.filter((slug) => scopedSlugs.includes(slug))
      : enabledSlugs;

  const types: ReportType[] = [];
  for (const slug of visibleSlugs) {
    const type = REPORT_FOR_PACK[slug];
    if (type && !types.includes(type)) types.push(type);
  }

  // The trust packet spans every enabled framework, so it can only be offered
  // to a token that is not restricted to a subset of them.
  if (types.length > 0 && scopedSlugs.length === 0) types.push('trust');

  return types;
}
