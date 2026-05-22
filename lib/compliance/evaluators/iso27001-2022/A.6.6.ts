/**
 * ISO/IEC 27001:2022 A.6.6 — "Confidentiality or non-disclosure agreements"
 *
 * A.6.6 requires signed NDAs for staff and contractors — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.6.6',
  'A.6.6 requires signed NDAs for staff and contractors — manual attestation.',
);

export { evaluate, meta };
