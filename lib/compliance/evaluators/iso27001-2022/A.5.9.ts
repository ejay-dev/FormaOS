/**
 * ISO/IEC 27001:2022 A.5.9 — "Inventory of information and other associated assets"
 *
 * Signal: org_evidence rows tagged as asset / inventory artefacts.
 * Pass requires at least one such artefact updated within the
 * 180-day cadence the pack defines. Empty inventory is a fail.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  FRAMEWORK,
  daysSince,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'A.5.9';
const REVIEW_WINDOW_DAYS = 180;

type EvidenceRow = {
  id: string;
  title: string | null;
  evidence_type: string | null;
  tags: string[] | null;
  collected_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function looksLikeAsset(row: EvidenceRow): boolean {
  const haystack = `${row.title ?? ''} ${row.evidence_type ?? ''} ${(row.tags ?? []).join(' ')}`.toLowerCase();
  return /asset|inventory|register|cmdb/.test(haystack);
}

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_evidence')
    .select('id, title, evidence_type, tags, collected_at, created_at, updated_at')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_evidence_unavailable',
      `Could not read org_evidence: ${error.message}`,
    );
  }

  const rows = (data ?? []) as EvidenceRow[];
  const assets = rows.filter(looksLikeAsset);

  if (assets.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_asset_inventory_evidence',
          message: 'No org_evidence rows tagged as asset / inventory / register — A.5.9 requires a maintained asset register.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `0 asset-inventory artefacts in ${rows.length} org_evidence row(s).`,
      evaluatedAt,
    };
  }

  const newest = assets
    .map((r) => r.updated_at ?? r.collected_at ?? r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceUpdate = daysSince(newest);

  const gaps: ControlGap[] = [];
  if (sinceUpdate != null && sinceUpdate > REVIEW_WINDOW_DAYS) {
    gaps.push({
      code: 'asset_inventory_stale',
      message: `Most recent asset-inventory update was ${sinceUpdate}d ago — exceeds the ${REVIEW_WINDOW_DAYS}-day cadence.`,
      severity: sinceUpdate > REVIEW_WINDOW_DAYS * 2 ? 'high' : 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = assets.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_evidence',
    ref: r.id,
    capturedAt: r.updated_at ?? r.collected_at ?? r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (sinceUpdate == null || sinceUpdate <= REVIEW_WINDOW_DAYS) status = 'pass';
  else if (sinceUpdate <= REVIEW_WINDOW_DAYS * 2) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, assets.length / 3)),
    reason: `${assets.length} asset-inventory artefact(s); most recent update ${sinceUpdate ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
