/**
 * NDIS-V.2 — Implementing Behaviour Support — restrictive practices oversight.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Restrictive practices
 * register isn't modelled in the FormaOS schema yet; would require a
 * dedicated restrictive_practice_register table + behaviour_support_plan
 * linkage.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-V.2',
  'NDIS Verification Module V.2 requires a restrictive practices register, authorisations on file, and monthly reportable use captured. Manual-attestation pending Phase 3 restrictive-practice schema work.',
);

export { meta, evaluate };
