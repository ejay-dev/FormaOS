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

  // Controls with at least one piece of current evidence
  const { data: controlsWithEvidence } = await db
    .from('org_evidence')
    .select('control_id')
    .in('freshness_status', ['current', 'expiring_soon'])
    .not('control_id', 'is', null);

  const uniqueControls = new Set(
    (controlsWithEvidence ?? []).map((e: { control_id: string | null }) => e.control_id),
  );
  const total = totalControls ?? 0;

  return {
    totalControls: total,
    coveredControls: uniqueControls.size,
    coverage: total > 0 ? Math.round((uniqueControls.size / total) * 100) : 100,
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
