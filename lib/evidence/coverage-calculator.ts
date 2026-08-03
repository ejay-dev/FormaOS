import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';

/**
 * Calculate evidence coverage as a percentage of controls with adequate evidence.
 */
export async function calculateCoverage(orgId: string, frameworkId?: string) {
  const db = createSupabaseOrgClient(orgId);

  let controlQuery = db
    .from('org_controls')
    .select('id', { count: 'exact', head: true })

  if (frameworkId) {
    controlQuery = controlQuery.eq('framework_id', frameworkId);
  }

  const { count: totalControls } = await controlQuery;

  // Controls with at least one piece of current evidence.
  //
  // Audit 2026-08-03: this selected org_evidence.control_id, a column that does
  // NOT exist in production. PostgREST returned 42703, the error was discarded,
  // and the set came back empty — so every organisation was shown 0% evidence
  // coverage as though it were a real measurement.
  //
  // The error is now surfaced rather than swallowed, but note the deeper
  // problem it was masking: there is currently NO working evidence-to-control
  // link in production. org_evidence has no control_id, and the
  // control_evidence join table holds 74 rows from a single 2026-04-19 seed for
  // one organisation whose evidence_id values match no row in org_evidence (the
  // column carries no foreign key). Repointing this query at that table would
  // still return zero while looking correct, which is worse than failing — so
  // coverage reports `unavailable` until the linkage is rebuilt, and callers
  // render that instead of a fabricated 0%.
  const { data: linkRows, error: linkError } = await db
    .from('control_evidence')
    .select('control_id, evidence_id');

  const total = totalControls ?? 0;

  if (linkError) {
    return {
      totalControls: total,
      coveredControls: 0,
      coverage: null,
      unavailable: true as const,
      reason: `Evidence coverage could not be read: ${linkError.message}`,
    };
  }

  const linkedEvidenceIds = Array.from(
    new Set(
      (linkRows ?? [])
        .map((row: { evidence_id: string | null }) => row.evidence_id)
        .filter((id: string | null): id is string => Boolean(id)),
    ),
  );

  // Only count a control as covered when its linked evidence actually exists
  // and is current — a dangling link is not coverage.
  const { data: freshEvidence, error: freshError } = linkedEvidenceIds.length
    ? await db
        .from('org_evidence')
        .select('id')
        .in('id', linkedEvidenceIds)
        .in('freshness_status', ['current', 'expiring_soon'])
    : { data: [], error: null };

  if (freshError) {
    return {
      totalControls: total,
      coveredControls: 0,
      coverage: null,
      unavailable: true as const,
      reason: `Evidence coverage could not be read: ${freshError.message}`,
    };
  }

  const freshIds = new Set(
    (freshEvidence ?? []).map((row: { id: string }) => row.id),
  );
  const uniqueControls = new Set(
    (linkRows ?? [])
      .filter((row: { evidence_id: string | null }) =>
        row.evidence_id ? freshIds.has(row.evidence_id) : false,
      )
      .map((row: { control_id: string | null }) => row.control_id),
  );

  return {
    totalControls: total,
    coveredControls: uniqueControls.size,
    coverage: total > 0 ? Math.round((uniqueControls.size / total) * 100) : 100,
    unavailable: false as const,
    reason: null,
  };
}

type Gap = {
  controlId: string;
  controlCode: string;
  controlTitle: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reason: 'no_evidence' | 'expired_evidence' | 'needs_review';
};

/**
 * Identify controls without adequate evidence.
 */
export async function identifyGaps(
  orgId: string,
  frameworkId?: string,
): Promise<Gap[]> {
  const db = createSupabaseOrgClient(orgId);

  let query = db
    .from('org_controls')
    .select('id, code, title, priority')

  if (frameworkId) {
    query = query.eq('framework_id', frameworkId);
  }

  const { data: controls } = await query;
  if (!controls || controls.length === 0) return [];

  // Get evidence mapped to controls
  const { data: evidence } = await db
    .from('org_evidence')
    .select('control_id, freshness_status')
    .not('control_id', 'is', null);

  const evidenceByControl = new Map<string, string[]>();
  for (const e of evidence ?? []) {
    if (!e.control_id) continue;
    const statuses = evidenceByControl.get(e.control_id) ?? [];
    statuses.push(e.freshness_status ?? 'current');
    evidenceByControl.set(e.control_id, statuses);
  }

  const gaps: Gap[] = [];

  for (const control of controls) {
    const statuses = evidenceByControl.get(control.id);

    if (!statuses || statuses.length === 0) {
      gaps.push({
        controlId: control.id,
        controlCode: control.code ?? '',
        controlTitle: control.title ?? '',
        severity: priorityToSeverity(control.priority),
        reason: 'no_evidence',
      });
    } else if (statuses.every((s) => s === 'expired')) {
      gaps.push({
        controlId: control.id,
        controlCode: control.code ?? '',
        controlTitle: control.title ?? '',
        severity: priorityToSeverity(control.priority),
        reason: 'expired_evidence',
      });
    } else if (statuses.every((s) => s === 'needs_review')) {
      gaps.push({
        controlId: control.id,
        controlCode: control.code ?? '',
        controlTitle: control.title ?? '',
        severity: 'medium',
        reason: 'needs_review',
      });
    }
  }

  return gaps.sort(
    (a, b) => severityOrder(a.severity) - severityOrder(b.severity),
  );
}

/**
 * Get only critical gaps (high-priority controls without evidence).
 */
export async function getCriticalGaps(orgId: string): Promise<Gap[]> {
  const gaps = await identifyGaps(orgId);
  return gaps.filter((g) => g.severity === 'critical' || g.severity === 'high');
}

function priorityToSeverity(priority?: string): Gap['severity'] {
  switch (priority) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    default:
      return 'low';
  }
}

function severityOrder(s: Gap['severity']): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[s];
}
