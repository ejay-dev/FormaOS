/**
 * Shared helpers for the PCI DSS 4.0 pack.
 *
 * Audit compliance-004 (2026-05-22) — phase 4 of multi-PR rollout.
 * The PCI DSS pack ships 11 controls covering network, data
 * protection, vulnerability, monitoring, and policy. We wire ~5
 * automated signals (malware scans, MFA, log cadence, security
 * testing, policy library) and let the remainder collapse to
 * `manualAttestation` — network/segmentation and cardholder-data
 * tracking are not modelled as rows in FormaOS today.
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

export const FRAMEWORK: FrameworkSlug = 'pci-dss';

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
