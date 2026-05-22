/**
 * ISO/IEC 27001:2022 A.8.14 — "Redundancy of information processing facilities"
 *
 * A.8.14 requires a redundancy / topology diagram — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.14',
  'A.8.14 requires a redundancy / topology diagram — manual attestation.',
);

export { evaluate, meta };
