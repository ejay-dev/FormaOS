/**
 * Shared helpers for the HIPAA Security Rule pack.
 *
 * Audit compliance-004 (2026-05-22) — phase 4 of multi-PR rollout.
 * The HIPAA pack ships 10 safeguards (administrative / physical /
 * technical). We wire ~3 automated signals (risk analysis, technical
 * access controls, audit controls) and let the rest fall back to
 * `manualAttestation` — physical safeguards (facility access,
 * workstation security) and procedural ones (training, sanction
 * policy) are signed-off artefacts FormaOS does not model.
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

export const FRAMEWORK: FrameworkSlug = 'hipaa';

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
