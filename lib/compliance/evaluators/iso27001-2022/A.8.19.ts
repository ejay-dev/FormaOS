/**
 * ISO/IEC 27001:2022 A.8.19 — "Installation of software on operational systems"
 *
 * A.8.19 requires evidence of software allow-listing or change control — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.19',
  'A.8.19 requires evidence of software allow-listing or change control — manual attestation.',
);

export { evaluate, meta };
