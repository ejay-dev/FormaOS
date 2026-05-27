/**
 * NDIS-M.2 — Restrictive practices and consent.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Same schema gap as
 * NDIS-V.2 — needs a behaviour-support-plan + consent linkage that
 * FormaOS doesn't model yet.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-M.2',
  'NDIS-M.2 requires authorised behaviour support plans + consent records. Manual-attestation pending Phase 3 schema work.',
);

export { meta, evaluate };
