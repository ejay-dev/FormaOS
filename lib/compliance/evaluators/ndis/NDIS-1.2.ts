/**
 * NDIS-1.2 — Individual values and beliefs.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. FormaOS participant
 * profile schema does not currently capture cultural/spiritual context
 * in a structured way, so a faithful automated predicate is not yet
 * possible. ⚠️ Phase 3 candidate once participant-profile fields are
 * expanded.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-1.2',
  'NDIS-1.2 requires evidence that supports respect individual values, beliefs, and personal circumstances. Manual-attestation pending Phase 3 participant-profile schema work.',
);

export { meta, evaluate };
