/**
 * NDIS-2.8 — Continuity of supports.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Business-continuity
 * plans + backup arrangements aren't modelled in the FormaOS schema.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-2.8',
  'NDIS-2.8 requires a business continuity plan + documented backup arrangements. Manual-attestation pending Phase 3 schema work.',
);

export { meta, evaluate };
