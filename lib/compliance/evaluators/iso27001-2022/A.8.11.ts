/**
 * ISO/IEC 27001:2022 A.8.11 — "Data masking"
 *
 * A.8.11 requires evidence of masking applied in non-prod — no masking-policy table exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.11',
  'A.8.11 requires evidence of masking applied in non-prod — no masking-policy table exists yet, manual attestation.',
);

export { evaluate, meta };
