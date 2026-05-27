/**
 * Shared helpers for the NDIS Practice Standards pack.
 *
 * Audit 2026-05-27 (R10 Phase 1) — closes the marketing-vs-reality gap
 * where the platform claimed NDIS coverage but ran the SOC 2 evaluator
 * pack under the hood. Phase 1 ships 8 controls covering Standards 1–4
 * of the Core Module, all as manual-attestation evaluators returning
 * `not_evaluated`. Phase 2 (deferred, requires NDIS-domain expert) will:
 *
 *   1. Expand to the full ~25-30 Core Module indicator set
 *      (Standards 1.1–1.5, 2.1–2.8, 3.1–3.5, 4.1–4.2 each with multiple
 *      quality indicators).
 *   2. Add the Verification Module (Specialist Behaviour Support,
 *      Implementing Behaviour Support) where applicable.
 *   3. Replace manual-attestation stubs with predicate logic against
 *      the FormaOS schema — incident table cadence, staff worker-screening
 *      expirations, service-agreement coverage, etc.
 *
 * See docs/compliance/ndis-framework-status.md for the Phase 2 punch list
 * and the publicly-published Practice Standards mapping.
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

export const FRAMEWORK: FrameworkSlug = 'ndis';

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
