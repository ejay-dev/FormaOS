/**
 * NDIS-3.3 — Service agreements with participants.
 *
 * Phase 1 (manual-attestation): signed service agreement covering
 * supports, fees, withdrawal rights, complaints process; reviewed when
 * supports change. Phase 2 might join participants × signed_documents.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-3.3',
  'NDIS-3.3 requires a signed service agreement covering supports, fees, withdrawal rights, and complaints process — reviewed when supports change. Manual-attestation pending Phase 2 join against participants × signed_documents.',
);

export { meta, evaluate };
