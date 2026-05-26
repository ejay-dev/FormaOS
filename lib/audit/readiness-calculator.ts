import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { getFrameworkCodeForSlug } from '@/lib/frameworks/framework-installer';

export type FrameworkReadiness = {
  frameworkId: string;
  frameworkCode: string;
  frameworkTitle: string;
  readinessScore: number;
  totalControls: number;
  satisfiedControls: number;
  missingControls: number;
  partialControls: number;
  evaluatedAt: string | null;
};

export async function calculateFrameworkReadiness(
  orgId: string,
): Promise<FrameworkReadiness[]> {
  const supabase = createSupabaseOrgClient(orgId);
  // compliance_frameworks is a global catalog (not org-scoped) — drop
  // to the underlying admin client for that one query.
  const admin = supabase.unsafeAdmin();

  type FrameworkCatalogRow = {
    id: string;
    code: string;
    title: string | null;
  };

  const { data: frameworksRaw } = await admin
    .from('compliance_frameworks')
    // Schema column is `name`; older code referenced `title` and hit prod
    // log error "column compliance_frameworks.title does not exist" (audit
    // database-017). Alias keeps response shape stable for consumers.
    .select('id, code, title:name');

  let frameworks: FrameworkCatalogRow[] | null =
    (frameworksRaw as FrameworkCatalogRow[] | null) ?? null;
  if (!frameworks?.length) return [];

  try {
    // .eq('organization_id', orgId) appended automatically.
    const { data: enabled } = await supabase
      .from('org_frameworks')
      .select('framework_slug');

    const enabledSlugs = ((enabled ?? []) as Array<{ framework_slug: string }>).map(
      (row) => row.framework_slug,
    );
    if (enabledSlugs.length) {
      const enabledCodes = new Set(
        enabledSlugs.map((slug: string) => getFrameworkCodeForSlug(slug)),
      );
      frameworks = frameworks.filter((fw) => enabledCodes.has(fw.code));
    }
  } catch {
    // ignore and fallback to full list
  }

  // .eq('organization_id', orgId) appended automatically.
  const { data: snapshots } = await supabase
    .from('org_control_evaluations')
    .select(
      'framework_id, compliance_score, total_controls, satisfied_controls, missing_controls, partial_control_codes, last_evaluated_at',
    )
    .eq('control_type', 'framework_snapshot')
    .order('last_evaluated_at', { ascending: false });

  const latestByFramework = new Map<string, Record<string, unknown>>();
  (snapshots ?? []).forEach(
    (row: { framework_id?: string; [key: string]: unknown }) => {
      if (!row.framework_id) return;
      if (!latestByFramework.has(row.framework_id)) {
        latestByFramework.set(row.framework_id, row);
      }
    },
  );

  return frameworks.map((framework) => {
    const snapshot = latestByFramework.get(framework.id);
    const totalControls = Number(snapshot?.total_controls ?? 0);
    const satisfiedControls = Number(snapshot?.satisfied_controls ?? 0);
    const missingControls = Number(snapshot?.missing_controls ?? 0);
    const partialControls = Array.isArray(snapshot?.partial_control_codes)
      ? (snapshot.partial_control_codes as unknown[]).length
      : 0;

    const readinessScore = Number(snapshot?.compliance_score ?? 0);

    return {
      frameworkId: framework.id,
      frameworkCode: framework.code ?? 'UNKNOWN',
      frameworkTitle: framework.title ?? framework.code,
      readinessScore,
      totalControls,
      satisfiedControls,
      missingControls,
      partialControls,
      evaluatedAt: (snapshot?.last_evaluated_at as string | undefined) ?? null,
    };
  });
}
