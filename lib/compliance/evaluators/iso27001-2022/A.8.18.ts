/**
 * ISO/IEC 27001:2022 A.8.18 — "Use of privileged utility programs"
 *
 * A.8.18 requires evidence of restricted use of privileged utilities — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.18',
  'A.8.18 requires evidence of restricted use of privileged utilities — manual attestation.',
);

export { evaluate, meta };
