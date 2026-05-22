/**
 * SOC2-TSC CC3.3 — "Assesses fraud risk"
 *
 * Partial signal: `org_risks` rows whose category or title references
 * fraud / corruption / abuse. Pass requires at least one such risk
 * scored within the 365-day review cadence; fall back to manual
 * attestation when none exist (the criterion may still be satisfied
 * by a tabletop assessment outside the system).
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, manualAttestation, notEvaluated, round2 } from './_shared';

const CODE = 'CC3.3';
const REVIEW_WINDOW_DAYS = 365;
const FRAUD_PATTERN = /fraud|corruption|abuse|kickback|misappropriation|insider threat/i;

type RiskRow = {
  id: string;
  title: string | null;
  category: string | null;
  likelihood: number | null;
  impact: number | null;
  updated_at: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_risks')
    .select('id, title, category, likelihood, impact, updated_at, created_at')
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
  const fraudRisks = rows.filter(
    (r) => FRAUD_PATTERN.test(r.title ?? '') || FRAUD_PATTERN.test(r.category ?? ''),
  );

  if (fraudRisks.length === 0) {
    return manualAttestation(
      CODE,
      evaluatedAt,
      `CC3.3 requires attestation by a compliance officer — no fraud-categorised entries in ${rows.length} org_risks row(s). A fraud-risk tabletop may have been performed outside the system.`,
    );
  }

  const newest = fraudRisks
    .map((r) => r.updated_at || r.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceReview = daysSince(newest);
  const fresh = sinceReview != null && sinceReview <= REVIEW_WINDOW_DAYS;

  const evidence: EvidenceRef[] = fraudRisks.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_risks',
    ref: r.id,
    capturedAt: r.updated_at ?? r.created_at ?? undefined,
  }));

  let status: 'pass' | 'partial' | 'fail';
  const gaps: { code: string; message: string; severity: 'medium' | 'high' }[] = [];
  if (fresh) {
    status = 'pass';
  } else {
    status = 'partial';
    gaps.push({
      code: 'fraud_review_stale',
      message: `Most recent fraud-categorised risk update was ${sinceReview ?? '?'} days ago — exceeds the ${REVIEW_WINDOW_DAYS}-day review cadence.`,
      severity: 'medium',
    });
  }

  return {
    controlCode: CODE,
    status,
    evidenceRefs: evidence,
    gaps,
    confidence: round2(0.55 + 0.45 * Math.min(1, fraudRisks.length / 3)),
    reason: `${fraudRisks.length} fraud-categorised risk(s); most recent update ${sinceReview ?? '?'}d ago.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
