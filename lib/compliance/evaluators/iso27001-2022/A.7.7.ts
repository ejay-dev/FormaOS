/**
 * ISO/IEC 27001:2022 A.7.7 — "Clear desk and clear screen"
 *
 * A.7.7 requires clear-desk policy acknowledgements — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.7',
  'A.7.7 requires clear-desk policy acknowledgements — manual attestation.',
);

export { evaluate, meta };
