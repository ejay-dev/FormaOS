/**
 * ISO/IEC 27001:2022 A.5.5 — "Contact with authorities"
 *
 * A.5.5 requires a current list of regulator / law-enforcement contacts maintained outside the platform — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.5',
  'A.5.5 requires a current list of regulator / law-enforcement contacts maintained outside the platform — manual attestation.',
);

export { evaluate, meta };
