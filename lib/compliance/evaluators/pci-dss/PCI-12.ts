/**
 * PCI-12 — Security policy and training.
 *
 * Signal: org_policies with at least one active/approved policy
 * reviewed in the last 365 days (the pack cadence). Mirrors
 * SOC2-TSC CC5.3.
 */

import type {
  ControlEvaluator,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  daysSince,
  makeAutomatedEvaluator,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'PCI-12';
const REVIEW_WINDOW_DAYS = 365;
const ACTIVE_STATUSES = new Set(['approved', 'active', 'published', 'in_force']);

type PolicyRow = {
  id: string;
  title: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_policies')
    .select('id, title, status, updated_at, created_at')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_policies_unavailable',
      `Could not read org_policies: ${error.message}`,
    );
  }

  const rows = (data ?? []) as PolicyRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_policies',
          message:
            'No entries in org_policies — PCI-12 requires a documented security policy.',
          severity: 'high',
        },
      ],
      confidence: 0.85,
      reason: 'No policies recorded.',
      evaluatedAt,
    };
  }

  const active = rows.filter((p) =>
    ACTIVE_STATUSES.has((p.status || '').toLowerCase()),
  );
  const fresh = active.filter((p) => {
    const since = daysSince(p.updated_at ?? p.created_at);
    return since != null && since <= REVIEW_WINDOW_DAYS;
  });

  const gaps: ControlGap[] = [];
  if (active.length === 0) {
    gaps.push({
      code: 'no_active_policies',
      message: `${rows.length} polic(ies) exist but none are in approved/active status.`,
      severity: 'high',
    });
  }
  if (active.length > 0 && fresh.length / active.length < 0.7) {
    gaps.push({
      code: 'stale_policies',
      message: `${active.length - fresh.length} of ${active.length} active polic(ies) have not been reviewed in the last ${REVIEW_WINDOW_DAYS}d.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = active.slice(0, EVIDENCE_CAP).map((p) => ({
    source: 'org_policies',
    ref: p.id,
    capturedAt: p.updated_at ?? p.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (active.length === 0) status = 'fail';
  else if (active.length >= 1 && fresh.length / active.length >= 0.9) status = 'pass';
  else if (fresh.length / active.length >= 0.6) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, active.length / 5)),
    reason: `${active.length} active polic(ies); ${fresh.length} reviewed within ${REVIEW_WINDOW_DAYS}d.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };
