/**
 * ISO/IEC 27001:2022 A.7.14 — "Secure disposal or re-use of equipment"
 *
 * A.7.14 requires disposal certificates or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.14',
  'A.7.14 requires disposal certificates or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
