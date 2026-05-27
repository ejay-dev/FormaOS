/**
 * NDIS-W.1 — Worker engagement and wellbeing.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Supervision records +
 * staff-wellbeing artefacts aren't modelled in the FormaOS schema.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-W.1',
  'NDIS-W.1 requires documented supervision cadence + worker wellbeing supports. Manual-attestation pending Phase 3 schema work.',
);

export { meta, evaluate };
