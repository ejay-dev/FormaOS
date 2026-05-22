/**
 * ISO/IEC 27001:2022 A.8.30 — "Outsourced development"
 *
 * A.8.30 requires outsourcing-contract evidence and review records — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.30',
  'A.8.30 requires outsourcing-contract evidence and review records — manual attestation.',
);

export { evaluate, meta };
