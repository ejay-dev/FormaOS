/**
 * NDIS-1.4 — Independence and informed choice.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Consent-records schema
 * exists but a faithful predicate requires a supported-decision-making
 * field on participant profiles that doesn't yet exist. ⚠️ Phase 3
 * candidate.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-1.4',
  'NDIS-1.4 requires supported-decision-making + consent records. Manual-attestation pending Phase 3 participant-profile schema work.',
);

export { meta, evaluate };
