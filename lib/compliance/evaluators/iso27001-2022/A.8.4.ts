/**
 * ISO/IEC 27001:2022 A.8.4 — "Access to source code"
 *
 * A.8.4 requires repo access lists and branch-protection settings exported from the VCS — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.4',
  'A.8.4 requires repo access lists and branch-protection settings exported from the VCS — manual attestation.',
);

export { evaluate, meta };
