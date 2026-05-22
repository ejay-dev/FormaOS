/**
 * SOC2-TSC P1.1 — "Provides notice about privacy practices"
 *
 * Partial signal: `org_policies` titled with "privacy notice" /
 * "privacy policy" demonstrates the artefact exists. Effective-date
 * tracking still needs a human reviewer.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, daysSince, manualAttestation } from './_shared';

const CODE = 'P1.1';
const REVIEW_WINDOW_DAYS = 365;
const PRIVACY_PATTERN = /privacy (notice|policy|statement)/i;
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
    .limit(500);

  if (error) {
    return manualAttestation(
      CODE,
      evaluatedAt,
      `P1.1 requires attestation by a compliance officer — could not probe org_policies for supporting context (${error.message}).`,
    );
  }

  const rows = (data ?? []) as PolicyRow[];
  const privacy = rows.filter((p) => PRIVACY_PATTERN.test(p.title ?? ''));
  const active = privacy.filter((p) =>
    ACTIVE_STATUSES.has((p.status || '').toLowerCase()),
  );
  const fresh = active.filter((p) => {
    const since = daysSince(p.updated_at ?? p.created_at);
    return since != null && since <= REVIEW_WINDOW_DAYS;
  });

  if (privacy.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_privacy_notice',
          message:
            'No org_policies entry titled "privacy notice"/"privacy policy" — privacy practices are not communicated.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `No privacy-titled policies in ${rows.length} org_policies row(s).`,
      evaluatedAt,
    };
  }

  const evidenceRefs: EvidenceRef[] = privacy.slice(0, EVIDENCE_CAP).map((p) => ({
    source: 'org_policies',
    ref: p.id,
    capturedAt: p.updated_at ?? p.created_at ?? undefined,
  }));

  if (active.length > 0 && fresh.length > 0) {
    return {
      controlCode: CODE,
      status: 'pass',
      evidenceRefs,
      gaps: [],
      confidence: 0.8,
      reason: `${active.length} active privacy notice(s); ${fresh.length} refreshed within ${REVIEW_WINDOW_DAYS}d.`,
      evaluatedAt,
    };
  }

  return {
    controlCode: CODE,
    status: 'partial',
    evidenceRefs,
    gaps: [
      {
        code: active.length === 0 ? 'privacy_notice_inactive' : 'privacy_notice_stale',
        message:
          active.length === 0
            ? 'Privacy notice exists but is not in an active/approved status.'
            : `Privacy notice has not been refreshed within ${REVIEW_WINDOW_DAYS} days.`,
        severity: 'medium',
      },
    ],
    confidence: 0.7,
    reason: `${privacy.length} privacy notice(s); ${active.length} active; ${fresh.length} fresh.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
