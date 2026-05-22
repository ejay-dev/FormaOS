/**
 * Shared helpers for CIS Critical Security Controls v8 evaluators.
 *
 * Audit compliance-004 (2026-05-22) — phase 4 of multi-PR rollout.
 * The full CIS v8 pack ships 18 controls. CIS is the most
 * technical of the remaining packs and we wire ~7 automated signals
 * (config scans, MFA coverage, vuln cadence, audit log freshness,
 * malware/EDR, recovery, IR cadence). The remainder collapse to
 * `manualAttestation` because the underlying signal (asset inventory,
 * network segmentation, training records) is not modelled in the
 * FormaOS schema today.
 *
 * Anything used by ≥2 evaluators lives here. Lower-level helpers
 * (`notEvaluated`, `manualAttestation`, `daysSince`, `round2`,
 * `EVIDENCE_CAP`) are re-exported from the SOC2-TSC shared module so
 * the packs stay aligned on shape and error reporting.
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

export const FRAMEWORK: FrameworkSlug = 'cis-controls';

/**
 * Build a `manualAttestation` evaluator with one line per call. Most
 * CIS controls that lack a structured FormaOS signal (asset inventory,
 * network monitoring, training records, vendor assessments) collapse
 * to this — the evidence is a human-attested artefact we don't model
 * as rows today.
 */
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

/**
 * Wrap a builder into the `{ evaluator, meta }` shape expected by the
 * register, with `framework: 'cis-controls'` already filled in.
 */
export function makeAutomatedEvaluator(
  controlCode: string,
  evaluator: ControlEvaluator,
): { evaluator: ControlEvaluator; meta: ControlEvaluatorMeta } {
  return {
    evaluator,
    meta: { framework: FRAMEWORK, controlCode, evaluator },
  };
}
