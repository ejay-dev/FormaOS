/**
 * Shared helpers for NIST Cybersecurity Framework 2.0 evaluators.
 *
 * Audit compliance-004 (2026-05-22) — phase 4 of multi-PR rollout.
 * The full NIST CSF 2.0 pack ships 15 subcategories across six
 * functions (Govern / Identify / Protect / Detect / Respond /
 * Recover). NIST CSF is principally a governance/program framework;
 * we wire ~6 automated signals (risk register, MFA + roles, data
 * protection, continuous monitoring, anomaly detection, recovery)
 * and let the rest fall back to `manualAttestation`.
 *
 * Lower-level helpers (`notEvaluated`, `manualAttestation`,
 * `daysSince`, `round2`, `EVIDENCE_CAP`) are re-exported from the
 * SOC2-TSC shared module so the packs stay aligned.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  FrameworkSlug,
} from '../types';
import {
  EVIDENCE_CAP,
  daysSince,
  manualAttestation,
  notEvaluated,
  round2,
} from '../soc2-tsc/_shared';

export {
  EVIDENCE_CAP,
  daysSince,
  manualAttestation,
  notEvaluated,
  round2,
};

export const FRAMEWORK: FrameworkSlug = 'nist-csf';

export function makeManualEvaluator(
  controlCode: string,
  message: string,
): { evaluator: ControlEvaluator; meta: ControlEvaluatorMeta } {
  const evaluator: ControlEvaluator = async () =>
    manualAttestation(controlCode, new Date().toISOString(), message);
  return {
    evaluator,
    meta: { framework: FRAMEWORK, controlCode, evaluator },
  };
}

export function makeAutomatedEvaluator(
  controlCode: string,
  evaluator: ControlEvaluator,
): { evaluator: ControlEvaluator; meta: ControlEvaluatorMeta } {
  return {
    evaluator,
    meta: { framework: FRAMEWORK, controlCode, evaluator },
  };
}
