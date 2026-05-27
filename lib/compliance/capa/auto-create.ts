/**
 * Audit 2026-05-27 (Tier 2.A) — CAPA auto-creation from evaluator fails.
 *
 * When a framework control's evaluator returns status='fail', open a CAPA
 * (Corrective and Preventive Action) so the finding ends up on someone's
 * follow-up list instead of just sitting on the dashboard.
 *
 * Dedupe by (organization_id, source_type, source_id) so re-evaluating
 * the same failing control doesn't spam the CAPA register. source_id is
 * the framework_control row id — stable across evaluations and unique
 * per (org, control). If the control flips back to pass on a later run
 * the existing CAPA stays open; the operator closes it manually after
 * verifying the remediation actually held.
 *
 * Severity comes from the first gap in the evaluator result. If there
 * are no gaps the severity defaults to 'medium'. Title comes from
 * `result.reason` (capped) and description from a joined gap list.
 *
 * Pure-function buildCapaInputs() is exported separately so jest can
 * drive payload shape + dedupe logic without a Supabase client.
 */

import type { ControlResult, ControlGap } from '@/lib/compliance/evaluators/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('lib/compliance/capa/auto-create');

export const CAPA_SOURCE_TYPE = 'compliance_evaluator';

export type FailingControl = {
  /** framework_control.id — the dedupe key + source_id. */
  controlId: string;
  /** framework_control.code — used in the CAPA title. */
  controlCode: string;
  /** framework_control.title — used in the CAPA description fallback. */
  controlTitle?: string | null;
  /** framework_control's framework slug (e.g. 'ndis', 'soc2'). */
  frameworkSlug?: string | null;
  result: ControlResult;
};

export type CapaInputRow = {
  organization_id: string;
  type: 'compliance_finding';
  source_type: typeof CAPA_SOURCE_TYPE;
  source_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open';
  created_by: string | null;
};

const TITLE_MAX = 180;

function severityFromGaps(gaps: ControlGap[]): CapaInputRow['severity'] {
  if (gaps.length === 0) return 'medium';
  const first = gaps[0].severity;
  if (first === 'critical' || first === 'high' || first === 'medium' || first === 'low') {
    return first;
  }
  return 'medium';
}

function severityToPriority(severity: CapaInputRow['severity']): CapaInputRow['priority'] {
  // 1:1 mapping today — kept separate so future tuning (e.g. SLA-driven
  // priority bumps for critical NDIS statutory breaches) can land here.
  return severity;
}

function buildDescription(failing: FailingControl): string {
  const lines: string[] = [];
  if (failing.frameworkSlug) {
    lines.push(`Framework: ${failing.frameworkSlug.toUpperCase()}`);
  }
  lines.push(`Control: ${failing.controlCode}${failing.controlTitle ? ` — ${failing.controlTitle}` : ''}`);
  if (failing.result.reason) {
    lines.push(`Finding: ${failing.result.reason}`);
  }
  if (failing.result.gaps.length > 0) {
    lines.push('');
    lines.push('Gaps:');
    for (const gap of failing.result.gaps) {
      const sev = gap.severity ? ` [${gap.severity}]` : '';
      lines.push(`- ${gap.code}${sev}: ${gap.message}`);
    }
  }
  if (failing.result.evidenceRefs.length > 0) {
    lines.push('');
    lines.push(`Evidence refs: ${failing.result.evidenceRefs.length}`);
  }
  lines.push('');
  lines.push('Auto-opened by FormaOS compliance evaluator. Resolve the underlying gap, then close this CAPA manually after verification.');
  return lines.join('\n');
}

function buildTitle(failing: FailingControl): string {
  const prefix = `${failing.frameworkSlug?.toUpperCase() ?? 'Compliance'} ${failing.controlCode}`;
  const reason = failing.result.reason?.trim();
  const remaining = TITLE_MAX - prefix.length - 3; // ": " + safety
  if (!reason) return prefix;
  const safeReason = reason.length > remaining ? `${reason.slice(0, remaining - 1)}…` : reason;
  return `${prefix}: ${safeReason}`;
}

/**
 * Pure: build the CapaInputRow payload from a failing-control record.
 * Used both by the writer (below) and tested directly without DB.
 */
export function buildCapaInputs(args: {
  orgId: string;
  failures: FailingControl[];
  createdBy: string | null;
}): CapaInputRow[] {
  return args.failures
    .filter((f) => f.result.status === 'fail')
    .map((failing) => {
      const severity = severityFromGaps(failing.result.gaps);
      return {
        organization_id: args.orgId,
        type: 'compliance_finding' as const,
        source_type: CAPA_SOURCE_TYPE,
        source_id: failing.controlId,
        title: buildTitle(failing),
        description: buildDescription(failing),
        severity,
        priority: severityToPriority(severity),
        status: 'open' as const,
        created_by: args.createdBy,
      };
    });
}

/**
 * Pure: filter a list of candidate inputs down to those NOT already
 * present in the existing-set. Existing keys are (source_type, source_id)
 * tuples returned by the DB lookup.
 */
export function dedupeAgainstExisting(
  inputs: CapaInputRow[],
  existing: Array<{ source_type: string | null; source_id: string | null }>,
): CapaInputRow[] {
  const seen = new Set(
    existing
      .filter((e) => e.source_type === CAPA_SOURCE_TYPE && e.source_id)
      .map((e) => `${e.source_type}::${e.source_id}`),
  );
  return inputs.filter(
    (row) => !seen.has(`${row.source_type}::${row.source_id}`),
  );
}

/**
 * Side-effect writer: dedupes against existing rows on org_capa_items,
 * then INSERTs the survivors. Best-effort — failures log to the server
 * logger but don't throw, so the evaluator path isn't blocked.
 *
 * Returns the count of rows inserted; callers can include it in their
 * activity / audit feed if useful.
 */
export async function autoCreateCapaFromFailures(
  supabase: SupabaseClient,
  args: {
    orgId: string;
    failures: FailingControl[];
    createdBy: string | null;
  },
): Promise<{ inserted: number; skipped: number }> {
  const candidates = buildCapaInputs(args);
  if (candidates.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const sourceIds = candidates.map((c) => c.source_id);

  const { data: existing, error: existingErr } = await supabase
    .from('org_capa_items')
    .select('source_type, source_id')
    .eq('organization_id', args.orgId)
    .eq('source_type', CAPA_SOURCE_TYPE)
    .in('source_id', sourceIds);

  if (existingErr) {
    log.warn(
      { err: existingErr, orgId: args.orgId, candidateCount: candidates.length },
      'CAPA auto-create dedupe lookup failed; skipping batch.',
    );
    return { inserted: 0, skipped: candidates.length };
  }

  const survivors = dedupeAgainstExisting(
    candidates,
    (existing ?? []) as Array<{ source_type: string | null; source_id: string | null }>,
  );

  if (survivors.length === 0) {
    return { inserted: 0, skipped: candidates.length };
  }

  const { error: insertErr } = await supabase.from('org_capa_items').insert(survivors);
  if (insertErr) {
    log.warn(
      { err: insertErr, orgId: args.orgId, attempted: survivors.length },
      'CAPA auto-create insert failed.',
    );
    return { inserted: 0, skipped: candidates.length };
  }

  return { inserted: survivors.length, skipped: candidates.length - survivors.length };
}
