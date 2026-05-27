import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ensureFrameworkPacksInstalled,
  PACK_SLUGS,
} from './framework-installer';
import { getServerSideFeatureFlags } from '@/lib/feature-flags';

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
};

function normalizeFrameworkSlug(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (PACK_SLUGS.includes(normalized)) return normalized;
  return ORG_FRAMEWORK_MAP[normalized] ?? null;
}

export async function syncOrgFrameworksFromOrgRecord(orgId: string) {
  const flags = getServerSideFeatureFlags();
  if (!flags.enableFrameworkEngine) return [];

  await ensureFrameworkPacksInstalled();
  const admin = createSupabaseAdminClient();

  const { data: orgRow } = await admin
    .from('organizations')
    .select('frameworks')
    .eq('id', orgId)
    .maybeSingle();

  const frameworksRaw = Array.isArray(orgRow?.frameworks)
    ? orgRow?.frameworks
    : [];
  const slugs = Array.from(
    new Set(
      frameworksRaw
        .map((entry: unknown) => normalizeFrameworkSlug(String(entry)))
        .filter((slug: string | null): slug is string => Boolean(slug)),
    ),
  );

  if (!slugs.length) return [];

  const rows = slugs.map((slug) => ({
    organization_id: orgId,
    framework_slug: slug,
    enabled_at: new Date().toISOString(),
  }));

  await admin
    .from('org_frameworks')
    .upsert(rows, { onConflict: 'organization_id,framework_slug' });

  return slugs;
}

export async function getOrgFrameworkOverview(orgId: string) {
  const flags = getServerSideFeatureFlags();
  if (!flags.enableFrameworkEngine) return [];

  await ensureFrameworkPacksInstalled();
  await syncOrgFrameworksFromOrgRecord(orgId);

  const admin = createSupabaseAdminClient();
  const { data: enabled } = await admin
    .from('org_frameworks')
    .select('framework_slug, enabled_at')
    .eq('organization_id', orgId);

  const enabledSlugs = (enabled ?? []).map(
    (row: { framework_slug: string }) => row.framework_slug,
  );
  if (!enabledSlugs.length) return [];

  const { data: frameworks } = await admin
    .from('frameworks')
    .select('id, name, slug, version, description, is_active')
    .in('slug', enabledSlugs);

  type FrameworkRow = Record<string, unknown> & {
    id?: string;
    slug?: string;
    name?: string;
    version?: string;
    description?: string;
    is_active?: boolean;
  };
  const _frameworkById = new Map(
    (frameworks ?? []).map((fw: FrameworkRow) => [fw.id, fw]),
  );
  const frameworkBySlug = new Map(
    (frameworks ?? []).map((fw: FrameworkRow) => [fw.slug, fw]),
  );

  const frameworkIds = (frameworks ?? []).map((fw: FrameworkRow) => fw.id);
  if (!frameworkIds.length) {
    return enabledSlugs.map((slug: string) => ({
      id: null as string | null,
      slug,
      name: slug.toUpperCase(),
      description: null,
      version: null,
      is_active: true,
      controlCount: 0,
      domains: [],
      enabledAt:
        (enabled?.find(
          (row: Record<string, unknown>) => row.framework_slug === slug,
        )?.enabled_at as string) ?? null,
    }));
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
  ]);

  const domainRows = domains.data ?? [];
  const controlRows = controls.data ?? [];

  const controlsByFramework = new Map<string, number>();
  const controlsByDomain = new Map<string, number>();

  type ControlRow = Record<string, unknown> & {
    framework_id: string;
    domain_id?: string;
  };
  type DomainRow = Record<string, unknown> & {
    id: string;
    framework_id: string;
    name: string;
    sort_order?: number;
  };
  controlRows.forEach((control: ControlRow) => {
    controlsByFramework.set(
      control.framework_id,
      (controlsByFramework.get(control.framework_id) ?? 0) + 1,
    );
    if (control.domain_id) {
      controlsByDomain.set(
        control.domain_id,
        (controlsByDomain.get(control.domain_id) ?? 0) + 1,
      );
    }
  });

  return enabledSlugs.map((slug: string) => {
    const framework = frameworkBySlug.get(slug) as FrameworkRow | undefined;
    const frameworkId = framework?.id;
    const domainSummary = (domainRows as DomainRow[])
      .filter((domain) => domain.framework_id === frameworkId)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((domain) => ({
        id: domain.id,
        name: domain.name,
        controlCount: controlsByDomain.get(domain.id) ?? 0,
      }));

    return {
      id: framework?.id ?? null,
      slug,
      name: framework?.name ?? slug.toUpperCase(),
      description: framework?.description ?? null,
      version: framework?.version ?? null,
      is_active: framework?.is_active ?? true,
      controlCount: frameworkId
        ? (controlsByFramework.get(frameworkId) ?? 0)
        : 0,
      domains: domainSummary,
      enabledAt:
        (enabled?.find(
          (row: Record<string, unknown>) => row.framework_slug === slug,
        )?.enabled_at as string) ?? null,
    };
  });
}

export type FrameworkEvaluationTally = {
  pass: number;
  partial: number;
  fail: number;
  not_evaluated: number;
  total: number;
  /** evaluator-bound rows whose status is anything other than the four above */
  other: number;
  /** Most-recent last_evaluated_at across per-control rows; null if none yet. */
  lastEvaluatedAt: string | null;
};

/**
 * Per-framework pass/partial/fail/not_evaluated tally for the dashboard.
 * Reads per-control rows from public.org_control_evaluations and groups by
 * framework_id. Framework-level aggregate rows (the older row shape that
 * stores compliance_score on a single row per framework) are ignored — those
 * are identified by total_controls IS NOT NULL.
 *
 * Returns a map keyed by framework_id. Frameworks with zero per-control
 * rows are omitted; callers should treat absence as "no evaluations yet".
 */
export async function getFrameworkEvaluationTallies(
  orgId: string,
  frameworkIds: string[],
): Promise<Map<string, FrameworkEvaluationTally>> {
  const out = new Map<string, FrameworkEvaluationTally>();
  if (!frameworkIds.length) return out;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('org_control_evaluations')
    .select('framework_id, status, last_evaluated_at, total_controls')
    .eq('organization_id', orgId)
    .in('framework_id', frameworkIds);
  if (error || !data) return out;

  type Row = {
    framework_id: string | null;
    status: string | null;
    last_evaluated_at: string | null;
    total_controls: number | null;
  };

  for (const row of data as Row[]) {
    if (!row.framework_id) continue;
    // Skip framework-level aggregate rows — they have total_controls set
    // and don't represent a single control's outcome.
    if (row.total_controls != null) continue;

    let entry = out.get(row.framework_id);
    if (!entry) {
      entry = {
        pass: 0,
        partial: 0,
        fail: 0,
        not_evaluated: 0,
        other: 0,
        total: 0,
        lastEvaluatedAt: null,
      };
      out.set(row.framework_id, entry);
    }
    entry.total += 1;
    switch (row.status) {
      case 'pass':
        entry.pass += 1;
        break;
      case 'partial':
        entry.partial += 1;
        break;
      case 'fail':
        entry.fail += 1;
        break;
      case 'not_evaluated':
      case null:
        entry.not_evaluated += 1;
        break;
      default:
        entry.other += 1;
    }
    if (row.last_evaluated_at) {
      if (
        !entry.lastEvaluatedAt ||
        row.last_evaluated_at > entry.lastEvaluatedAt
      ) {
        entry.lastEvaluatedAt = row.last_evaluated_at;
      }
    }
  }

  return out;
}

export async function getCurrentOrgId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) throw new Error('Organization not found');

  return membership.organization_id as string;
}
