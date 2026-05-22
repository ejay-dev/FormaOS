/**
 * ISO/IEC 27001:2022 A.5.28 — "Collection of evidence"
 *
 * A.5.28 requires a documented forensic evidence-handling procedure and trained responders — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.28',
  'A.5.28 requires a documented forensic evidence-handling procedure and trained responders — manual attestation.',
);

export { evaluate, meta };
