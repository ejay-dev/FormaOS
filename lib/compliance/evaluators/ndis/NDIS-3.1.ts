/**
 * NDIS-3.1 — Access to supports.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Intake-process
 * documentation isn't a distinct artefact in the FormaOS schema yet.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-3.1',
  'NDIS-3.1 requires a documented intake process + eligibility criteria. Manual-attestation pending Phase 3 schema work.',
);

export { meta, evaluate };
