/**
 * Shared helpers for SOC2-TSC evaluators.
 *
 * Audit compliance-004 (2026-05-22) — phase 1 of multi-PR rollout.
 * The full SOC2-TSC pack ships 61 controls; this phase wires the
 * registry plumbing + an initial 10 evaluators. Subsequent PRs extend
 * coverage. Keep helpers minimal — anything used by ≥2 evaluators
 * lives here.
 */

import type {
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

export const EVIDENCE_CAP = 50;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function notEvaluated(
  controlCode: string,
  evaluatedAt: string,
  code: string,
  message: string,
  gaps: ControlGap[] = [],
  evidenceRefs: EvidenceRef[] = [],
): ControlResult {
  return {
    controlCode,
    status: 'not_evaluated',
    evidenceRefs,
    gaps: [{ code, message, severity: 'medium' }, ...gaps],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

/**
 * Build a `not_evaluated` result that explicitly flags the control as
 * "requires human attestation" — used where no automated signal is
 * meaningful (e.g. CC2.1 information-quality review).
 */
export function manualAttestation(
  controlCode: string,
  evaluatedAt: string,
  message: string,
): ControlResult {
  return {
    controlCode,
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [
      {
        code: 'manual_attestation_required',
        message,
        severity: 'low',
      },
    ],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}
