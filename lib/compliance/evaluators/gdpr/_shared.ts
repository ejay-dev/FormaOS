/**
 * Shared helpers for the GDPR Audit Workflow pack.
 *
 * Audit compliance-004 (2026-05-22) — phase 4 of multi-PR rollout.
 * The GDPR pack ships 10 controls and is overwhelmingly procedural
 * (records of processing, lawful basis, DPAs, transfer safeguards).
 * Only 2 controls have meaningful automated signal today
 * (retention/disposal records + incident detection); the rest are
 * `manualAttestation` until we model consent / ROPA / DPA tables.
 *
 * Lower-level helpers are re-exported from the SOC2-TSC shared module.
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

export const FRAMEWORK: FrameworkSlug = 'gdpr';

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
