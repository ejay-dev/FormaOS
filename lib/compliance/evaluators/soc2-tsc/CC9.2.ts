/**
 * SOC2-TSC CC9.2 — "Assesses and manages vendor risks"
 *
 * Signal: org_risks entries categorised as vendor/third-party/
 * sub-processor with an updated_at in the last 365 days. Pass: ≥1
 * vendor risk reviewed inside the cadence. Fail: no vendor entries
 * at all — the criterion requires an ongoing vendor risk register.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, notEvaluated, round2 } from './_shared';

const CODE = 'CC9.2';
const REVIEW_WINDOW_DAYS = 365;
const STALE_WINDOW_DAYS = 730;

type RiskRow = {
  id: string;
  title: string | null;
  category: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
};

function isVendorRisk(row: RiskRow): boolean {
  const haystack = `${row.title ?? ''} ${row.category ?? ''}`.toLowerCase();
  return /vendor|third[-_ ]?party|supplier|sub[-_ ]?processor|partner/.test(
    haystack,
  );
}

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_risks')
    .select('id, title, category, status, updated_at, created_at')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_risks_unavailable',
      `Could not read org_risks: ${error.message}`,
    );
  }

  const rows = (data ?? []) as RiskRow[];
  const vendors = rows.filter(isVendorRisk);

  if (vendors.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_vendor_risks',
          message:
            'org_risks has no vendor/third-party/sub-processor entries — vendor risk reviews are not documented.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `0 vendor entries in ${rows.length} org_risks row(s).`,
      evaluatedAt,
    };
  }

  const newest = vendors
    .map((r) => r.updated_at || r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceReview = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceReview != null && sinceReview > REVIEW_WINDOW_DAYS) {
    gaps.push({
      code: 'vendor_review_stale',
      message: `Most recent vendor review was ${sinceReview} days ago — exceeds the ${REVIEW_WINDOW_DAYS}-day cadence.`,
      severity: sinceReview > STALE_WINDOW_DAYS ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = vendors.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_risks',
    ref: r.id,
    capturedAt: r.updated_at ?? r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (sinceReview == null || sinceReview <= REVIEW_WINDOW_DAYS) status = 'pass';
  else if (sinceReview <= STALE_WINDOW_DAYS) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, vendors.length / 3)),
    reason: `${vendors.length} vendor risk(s); most recent review ${sinceReview ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
