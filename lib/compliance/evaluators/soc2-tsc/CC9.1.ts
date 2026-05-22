/**
 * SOC2-TSC CC9.1 — "Identifies, selects, and develops risk-mitigation
 * activities for disruptions"
 *
 * Signal: org_policies entries whose title or content references
 * business continuity / RTO / RPO / disaster recovery, in an active
 * status and reviewed within the last 365 days (the pack cadence).
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, notEvaluated, round2 } from './_shared';

const CODE = 'CC9.1';
const REVIEW_WINDOW_DAYS = 365;
const ACTIVE_STATUSES = new Set(['approved', 'active', 'published', 'in_force']);
const BCP_PATTERN = /business continuity|bcp|disaster recovery|rto|rpo|continuity/i;

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
  const continuity = rows.filter((p) => BCP_PATTERN.test(p.title ?? ''));

  if (continuity.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_continuity_policy',
          message:
            'No org_policies entry matches business-continuity/BCP/disaster-recovery — CC9.1 requires a documented continuity plan.',
          severity: 'high',
        },
      ],
      confidence: 0.75,
      reason: `0 continuity-flavoured policies in ${rows.length} org_policies row(s).`,
      evaluatedAt,
    };
  }

  const active = continuity.filter((p) =>
    ACTIVE_STATUSES.has((p.status || '').toLowerCase()),
  );
  const newest = active
    .map((p) => p.updated_at || p.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceReview = daysSince(newest);
  const fresh = sinceReview != null && sinceReview <= REVIEW_WINDOW_DAYS;

  const gaps: ControlGap[] = [];
  if (active.length === 0) {
    gaps.push({
      code: 'continuity_policy_inactive',
      message: 'Continuity policies exist but none are in an active/approved status.',
      severity: 'high',
    });
  }
  if (active.length > 0 && !fresh) {
    gaps.push({
      code: 'continuity_policy_stale',
      message: `Continuity policy last reviewed ${sinceReview ?? '?'} days ago — exceeds ${REVIEW_WINDOW_DAYS}-day cadence.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = continuity
    .slice(0, EVIDENCE_CAP)
    .map((p) => ({
      source: 'org_policies',
      ref: p.id,
      capturedAt: p.updated_at ?? p.created_at ?? undefined,
    }));

  let status: ControlResult['status'];
  if (active.length > 0 && fresh) status = 'pass';
  else if (active.length > 0) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, continuity.length / 2)),
    reason: `${continuity.length} continuity polic(ies); ${active.length} active; last update ${sinceReview ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
