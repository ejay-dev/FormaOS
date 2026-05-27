import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  aggregateHealth,
  type EvaluationRow,
  type FrameworkMeta,
  type HealthAggregate,
} from './aggregate';

/**
 * Fetch the per-control evaluation rows for an org's enabled frameworks
 * and aggregate them into the health-dashboard shape.
 *
 * Aggregate row shape (framework-level total_controls IS NOT NULL) is
 * skipped — those are the older row shape that lives alongside per-control
 * rows. The page wants per-control granularity.
 */
export async function getOrgHealthAggregate(
  orgId: string,
): Promise<HealthAggregate> {
  const admin = createSupabaseAdminClient();

  const { data: enabled } = await admin
    .from('org_frameworks')
    .select('framework_slug')
    .eq('organization_id', orgId);
  const slugs = (enabled ?? []).map(
    (r: { framework_slug: string }) => r.framework_slug,
  );
  if (!slugs.length) {
    return {
      overall: {
        score: 0,
        framework_count: 0,
        total: 0,
        status_counts: { pass: 0, partial: 0, fail: 0, not_evaluated: 0 },
      },
      frameworks: [],
      outstanding: [],
    };
  }

  const { data: frameworks } = await admin
    .from('frameworks')
    .select('id, slug, name')
    .in('slug', slugs);
  const frameworkRows = (frameworks ?? []) as FrameworkMeta[];
  if (frameworkRows.length === 0) {
    return {
      overall: {
        score: 0,
        framework_count: 0,
        total: 0,
        status_counts: { pass: 0, partial: 0, fail: 0, not_evaluated: 0 },
      },
      frameworks: [],
      outstanding: [],
    };
  }

  const frameworkIds = frameworkRows.map((f) => f.id);

  // Pull per-control evaluation rows. We filter out aggregate rows
  // (total_controls IS NOT NULL) on the JS side rather than via .is().not()
  // chains so we don't fight PostgREST's awkward null-filter syntax.
  const { data: evalRows } = await admin
    .from('org_control_evaluations')
    .select('framework_id, control_key, status, last_evaluated_at, total_controls')
    .eq('organization_id', orgId)
    .in('framework_id', frameworkIds);

  const perControl = ((evalRows ?? []) as Array<EvaluationRow & { total_controls: number | null }>)
    .filter((r) => r.total_controls == null);

  // Hydrate risk_level + control_title from framework_controls (one join via
  // a separate query keyed by framework_id + control_code). control_key on
  // org_control_evaluations matches framework_controls.control_code.
  const controlKeys = Array.from(
    new Set(perControl.map((r) => r.control_key).filter((k): k is string => !!k)),
  );

  let titlesByCompoundKey = new Map<string, { title: string | null; risk_level: string | null }>();
  if (controlKeys.length > 0) {
    const { data: fcRows } = await admin
      .from('framework_controls')
      .select('framework_id, control_code, title, default_risk_level')
      .in('framework_id', frameworkIds)
      .in('control_code', controlKeys);
    titlesByCompoundKey = new Map(
      ((fcRows ?? []) as Array<{
        framework_id: string;
        control_code: string;
        title: string | null;
        default_risk_level: string | null;
      }>).map((fc) => [
        `${fc.framework_id}::${fc.control_code}`,
        { title: fc.title, risk_level: fc.default_risk_level },
      ]),
    );
  }

  const hydrated: EvaluationRow[] = perControl.map((r) => {
    const meta = r.control_key
      ? titlesByCompoundKey.get(`${r.framework_id}::${r.control_key}`)
      : undefined;
    return {
      framework_id: r.framework_id,
      control_key: r.control_key,
      status: r.status,
      last_evaluated_at: r.last_evaluated_at,
      control_title: meta?.title ?? null,
      risk_level: meta?.risk_level ?? null,
    };
  });

  return aggregateHealth({ rows: hydrated, frameworks: frameworkRows });
}
